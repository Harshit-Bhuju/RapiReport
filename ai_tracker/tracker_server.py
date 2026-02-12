import numpy as np
import cv2
import math
import numpy as np
import cv2
import math
import mediapipe as mp
try:
    import mediapipe.python.solutions.pose as mp_pose
    import mediapipe.python.solutions.drawing_utils as mp_draw
    # Also import the styles if needed, or just standard drawing
except ImportError:
    # Fallback or standard import attempt if structure differs
    mp_pose = mp.solutions.pose
    mp_draw = mp.solutions.drawing_utils

from flask import Flask, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global variables
push_ups = 0
direction = 0  # 0: going down, 1: going up

# Initialize Pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def calculate_angle(img, p1, p2, p3, lm_list):
    """
    Calculate angle between three points (p1-p2-p3) from landmark list.
    p2 is the center point.
    """
    if len(lm_list) < max(p1, p2, p3):
        return 0
        
    x1, y1 = lm_list[p1][1:]
    x2, y2 = lm_list[p2][1:]
    x3, y3 = lm_list[p3][1:]

    # Calculate the Angle
    angle = math.degrees(math.atan2(y3 - y2, x3 - x2) -
                         math.atan2(y1 - y2, x1 - x2))
    if angle < 0:
        angle += 360

    # Draw
    cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 3)
    cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 3)
    cv2.circle(img, (x1, y1), 10, (0, 0, 255), cv2.FILLED)
    cv2.circle(img, (x1, y1), 15, (0, 0, 255), 2)
    cv2.circle(img, (x2, y2), 10, (0, 0, 255), cv2.FILLED)
    cv2.circle(img, (x2, y2), 15, (0, 0, 255), 2)
    cv2.circle(img, (x3, y3), 10, (0, 0, 255), cv2.FILLED)
    cv2.circle(img, (x3, y3), 15, (0, 0, 255), 2)
    
    cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50),
                cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)
    return angle

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def generate_frames():
    global push_ups, direction
    cap = cv2.VideoCapture(0)
    
    # UI Colors (BGR)
    COLOR_PRIMARY = (255, 165, 0)   # Cyan-ish
    COLOR_SECONDARY = (255, 255, 255) # White
    COLOR_BG_DARK = (40, 40, 40)    # Dark Gray
    
    while True:
        success, img = cap.read()
        if not success:
            break

        # Convert to RGB for MediaPipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(img_rgb)
        
        lm_list = []
        if results.pose_landmarks:
            mp_draw.draw_landmarks(img, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                   mp_draw.DrawingSpec(color=COLOR_PRIMARY, thickness=2, circle_radius=2),
                                   mp_draw.DrawingSpec(color=COLOR_SECONDARY, thickness=2, circle_radius=2))
            for id, lm in enumerate(results.pose_landmarks.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                lm_list.append([id, cx, cy])

        if len(lm_list) != 0:
            # Angles
            angle_r = calculate_angle(img, 12, 14, 16, lm_list)
            angle_l = calculate_angle(img, 11, 13, 15, lm_list)
            
            if angle_r > 180: angle_r = 360 - angle_r
            if angle_l > 180: angle_l = 360 - angle_l

            per_val1 = np.interp(angle_r, (70, 160), (100, 0))
            per_val2 = np.interp(angle_l, (70, 160), (100, 0))

            # Checking Reps
            if per_val1 >= 90 and per_val2 >= 90:
                if direction == 0:
                    push_ups += 0.5
                    direction = 1
            if per_val1 <= 10 and per_val2 <= 10:
                if direction == 1:
                    push_ups += 0.5
                    direction = 0

            # ─── DRAWING THE "GOOD UI" ───
            # 1. Header Bar
            cv2.rectangle(img, (0, 0), (640, 60), COLOR_BG_DARK, cv2.FILLED)
            # 2. Footer Bar
            cv2.rectangle(img, (0, 420), (640, 480), COLOR_BG_DARK, cv2.FILLED)

            # 3. Main Counter (Centered)
            cv2.putText(img, str(int(push_ups)), (290, 465), 
                        cv2.FONT_HERSHEY_DUPLEX, 1.5, COLOR_PRIMARY, 2)
            cv2.putText(img, "REPS", (350, 465), 
                        cv2.FONT_HERSHEY_PLAIN, 2, COLOR_SECONDARY, 2)

            # 4. Progress Bars (Side)
            bar_h = 300
            bar_w = 20
            
            # Left Bar
            cv2.rectangle(img, (10, 80), (10+bar_w, 80+bar_h), COLOR_BG_DARK, 1)
            bar_level_l = int(np.interp(per_val2, (0, 100), (80+bar_h, 80)))
            cv2.rectangle(img, (10, bar_level_l), (10+bar_w, 80+bar_h), COLOR_PRIMARY, cv2.FILLED)
            
            # Right Bar
            cv2.rectangle(img, (610, 80), (610+bar_w, 80+bar_h), COLOR_BG_DARK, 1)
            bar_level_r = int(np.interp(per_val1, (0, 100), (80+bar_h, 80)))
            cv2.rectangle(img, (610, bar_level_r), (610+bar_w, 80+bar_h), COLOR_PRIMARY, cv2.FILLED)

        # Encode frame
        ret, buffer = cv2.imencode('.jpg', img)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/status')
def status():
    return jsonify({
        "push_ups": int(push_ups),
        "direction": direction,
        "is_active": True
    })

@app.route('/reset')
def reset():
    global push_ups, direction
    push_ups = 0
    direction = 0
    return jsonify({"status": "reset"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)
