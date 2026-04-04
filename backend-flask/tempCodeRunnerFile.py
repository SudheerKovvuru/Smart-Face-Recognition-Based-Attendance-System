"""
Flask + SocketIO Face Recognition Server WITH ATTENDANCE
Processes video from Express backend and marks attendance
"""

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
from tensorflow import keras
import pickle
import threading
import time
import requests
from datetime import datetime

# ==================== CONFIGURATION ====================
YOLO_MODEL_PATH = "C:/Users/sudhe/Downloads/yolov9e-face-lindevs.pt"
FACE_CLASSIFIER_PATH = "D:/Downloads/face_model_final_v5.h5"
LABELS_PATH = "D:/Downloads/label_mapping_v5.pkl"

EXPRESS_API = "http://localhost:5000/api/video"

# Recognition settings
CONFIDENCE_THRESHOLD = 0.90
DETECTION_CHECKS = 5  # 5 checks per period
PADDING = 3

# ==================== FLASK APP SETUP ====================
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==================== LOAD MODELS ====================
print("="*60)
print("LOADING MODELS")
print("="*60)

print("\n1. Loading YOLO face detection model...")
yolo_model = YOLO(YOLO_MODEL_PATH)
print("   ✓ YOLO loaded")

print("\n2. Loading face recognition model...")
face_model = keras.models.load_model(FACE_CLASSIFIER_PATH)
print("   ✓ Face classifier loaded")

print("\n3. Loading label mappings...")
with open(LABELS_PATH, 'rb') as f:
    idx_to_label = pickle.load(f)
print(f"   ✓ Can recognize {len(idx_to_label)} people")

# ==================== VIDEO PROCESSING STATE ====================
active_streams = {}

# ==================== PREDICTION FUNCTION ====================
def predict_face_from_crop(face_crop, model, idx_to_label):
    try:
        if len(face_crop.shape) == 3:
            gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_crop

        normalized = gray.astype('float32') / 255.0
        input_img = np.expand_dims(normalized, axis=-1)
        input_img = np.expand_dims(input_img, axis=0)

        predictions = model.predict(input_img, verbose=0)[0]
        top_idx = np.argmax(predictions)
        label = idx_to_label[top_idx]
        confidence = predictions[top_idx] * 100

        return label, confidence
    except Exception as e:
        print(f"Error in prediction: {e}")
        return "unknown", 0.0

# ==================== PROCESS FRAME ====================
def process_frame(frame, yolo_model, face_model, idx_to_label, conf_threshold=0.90, padding=0):
    h, w = frame.shape[:2]
    results = yolo_model(frame, verbose=False)
    boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)

    detections = []
    for box in boxes:
        x1, y1, x2, y2 = box
        x1_pad = max(0, x1 - padding)
        y1_pad = max(0, y1 - padding)
        x2_pad = min(w, x2 + padding)
        y2_pad = min(h, y2 + padding)

        face_crop = frame[y1_pad:y2_pad, x1_pad:x2_pad]
        if face_crop.size == 0:
            continue
        
        face_crop = cv2.resize(face_crop, (112, 112), interpolation=cv2.INTER_CUBIC)
        label, confidence = predict_face_from_crop(face_crop, face_model, idx_to_label)

        if confidence >= conf_threshold * 100:
            detections.append({
                'box': [int(x1), int(y1), int(x2), int(y2)],
                'label': label,
                'confidence': float(confidence)
            })

    return detections

# ==================== MARK ATTENDANCE ====================
def mark_student_attendance(student_name, camera_id, confidence, check_number, period_number, token):
    """Call Express API to mark attendance using student name"""
    try:
        url = 'http://localhost:5000/api/attendance/mark-detection'
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        data = {
            'studentName': student_name,  # Send name instead of roll no
            'cameraId': camera_id,
            'confidence': float(confidence),
            'checkNumber': check_number,
            'periodNumber': period_number,
            'date': datetime.now().isoformat()
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=5)
        
        if response.ok:
            result = response.json()
            print(f"  ✓ Marked: {student_name} - Check {check_number} - Status: {result.get('status', 'pending')}")
            return True
        else:
            print(f"  ✗ Failed: {student_name} - {response.status_code} - {response.text[:100]}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error marking attendance for {student_name}: {e}")
        return False

# ==================== PROCESS VIDEO WITH ATTENDANCE ====================
def process_video_stream(camera_id, video_url, token, period_number=1):
    """
    Process video stream with attendance marking
    Makes 5 detection checks at intervals
    """
    print(f"\n{'='*60}")
    print(f"STARTING ATTENDANCE FOR {camera_id.upper()}")
    print(f"{'='*60}")
    print(f"Period: {period_number}")
    print(f"Checks: {DETECTION_CHECKS} times")
    
    # Add token to URL
    if token:
        separator = '&' if '?' in video_url else '?'
        video_url = f"{video_url}{separator}token={token}"
    
    cap = cv2.VideoCapture(video_url)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open video stream")
        socketio.emit('error', {'message': 'Could not open video stream'})
        return
    
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
    
    # For testing: make checks every 10 seconds instead of calculating from period
    check_interval_seconds = 10  # Check every 10 seconds for testing
    
    print(f"✓ Video opened. FPS: {fps}")
    print(f"✓ Will check attendance every {check_interval_seconds} seconds")
    print(f"\nStarting monitoring...\n")
    
    current_check = 1
    last_check_time = time.time()
    frame_count = 0
    detection_summary = {}
    
    while camera_id in active_streams and active_streams[camera_id] and current_check <= DETECTION_CHECKS:
        ret, frame = cap.read()
        
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        
        current_time = time.time()
        time_since_check = current_time - last_check_time
        
        # Time for detection check?
        if time_since_check >= check_interval_seconds:
            print(f"\n{'='*50}")
            print(f"CHECK {current_check}/{DETECTION_CHECKS} at {datetime.now().strftime('%H:%M:%S')}")
            print(f"{'='*50}")
            
            last_check_time = current_time
            
            # Detect faces
            detections = process_frame(
                frame, yolo_model, face_model, idx_to_label,
                CONFIDENCE_THRESHOLD, PADDING
            )
            
            if len(detections) == 0:
                print("  ⚠️  No faces detected in this check")
            else:
                print(f"  Found {len(detections)} face(s)")
            
            # Mark attendance for each detected student
            for detection in detections:
                student_name = detection['label']  # This is the name from model
                confidence = detection['confidence']
                
                # Track for summary
                if student_name not in detection_summary:
                    detection_summary[student_name] = 0
                detection_summary[student_name] += 1
                
                # Mark attendance using name
                mark_student_attendance(
                    student_name=student_name,
                    camera_id=camera_id,
                    confidence=confidence,
                    check_number=current_check,
                    period_number=period_number,
                    token=token
                )
            
            # Emit update to frontend
            socketio.emit('attendance_update', {
                'camera_id': camera_id,
                'period_number': period_number,
                'check_number': current_check,
                'total_checks': DETECTION_CHECKS,
                'detected_now': len(detections),
                'summary': detection_summary
            })
            
            current_check += 1
        
        # Emit live video detections for display (every frame)
        live_detections = process_frame(
            frame, yolo_model, face_model, idx_to_label,
            CONFIDENCE_THRESHOLD, PADDING
        )
        
        socketio.emit('detections', {
            'camera_id': camera_id,
            'detections': live_detections,
            'total_detected': len(live_detections),
            'frame_count': frame_count,
            'current_check': current_check - 1,
            'total_checks': DETECTION_CHECKS,
            'next_check_in': int(check_interval_seconds - time_since_check)
        })
        
        frame_count += 1
        time.sleep(1.0 / fps)
    
    cap.release()
    
    print(f"\n{'='*60}")
    print(f"ATTENDANCE COMPLETE")
    print(f"{'='*60}")
    print(f"Total students detected: {len(detection_summary)}")
    for student, count in detection_summary.items():
        status = "PRESENT" if count >= 3 else "ABSENT"
        print(f"  • {student}: {count}/{DETECTION_CHECKS} checks - {status}")
    print(f"{'='*60}\n")
    
    socketio.emit('attendance_complete', {
        'camera_id': camera_id,
        'period_number': period_number,
        'total_students': len(detection_summary),
        'summary': detection_summary
    })

# ==================== API ENDPOINTS ====================
@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'running',
        'models_loaded': True,
        'active_streams': list(active_streams.keys())
    })

@app.route('/api/start_stream/<camera_id>', methods=['POST'])
def start_stream(camera_id):
    if camera_id in active_streams and active_streams[camera_id]:
        return jsonify({'message': 'Stream already active'}), 200
    
    data = request.get_json() or {}
    token = data.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    period_number = data.get('periodNumber', 1)
    
    video_url = f"{EXPRESS_API}/{camera_id}.mp4"
    
    active_streams[camera_id] = True
    thread = threading.Thread(
        target=process_video_stream,
        args=(camera_id, video_url, token, period_number),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        'message': f'Started attendance monitoring for {camera_id}',
        'period': period_number
    }), 200

@app.route('/api/stop_stream/<camera_id>', methods=['POST'])
def stop_stream(camera_id):
    if camera_id in active_streams:
        active_streams[camera_id] = False
        return jsonify({'message': f'Stopped processing {camera_id}'}), 200
    return jsonify({'message': 'Stream not active'}), 404

# ==================== SOCKETIO EVENTS ====================
@socketio.on('connect')
def handle_connect():
    print('✓ Client connected')
    emit('connected', {'message': 'Connected to face recognition server'})

@socketio.on('disconnect')
def handle_disconnect():
    print('✗ Client disconnected')

@socketio.on('request_stream')
def handle_stream_request(data):
    camera_id = data.get('camera_id')
    token = data.get('token')
    period_number = data.get('periodNumber', 1)
    
    print(f"\n📹 Stream requested: {camera_id}, Period {period_number}")
    
    if camera_id not in active_streams or not active_streams[camera_id]:
        video_url = f"{EXPRESS_API}/{camera_id}.mp4"
        active_streams[camera_id] = True
        thread = threading.Thread(
            target=process_video_stream,
            args=(camera_id, video_url, token, period_number),
            daemon=True
        )
        thread.start()

# ==================== RUN SERVER ====================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("FACE RECOGNITION SERVER WITH ATTENDANCE")
    print("="*60)
    print(f"Server: http://localhost:5001")
    print(f"WebSocket: ws://localhost:5001")
    print(f"Attendance checks: {DETECTION_CHECKS} times per period")
    print(f"Check interval: Every 10 seconds (for testing)")
    print(f"{'='*60}\n")
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)