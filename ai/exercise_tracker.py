import numpy as np
import cv2
import time
import math
import mediapipe as mp
import requests
import json

# Configuration
USER_ID = 1 
API_URL = "http://localhost/RapiReport/backend/api/save_exercise.php"

# MediaPipe Setup
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_draw = mp.solutions.drawing_utils

def calculate_angle(img, p1, p2, p3, lm_list):
    if len(lm_list) < max(p1, p2, p3): return 0
    x1, y1 = lm_list[p1][1:]
    x2, y2 = lm_list[p2][1:]
    x3, y3 = lm_list[p3][1:]

    angle = math.degrees(math.atan2(y3 - y2, x3 - x2) -
                         math.atan2(y1 - y2, x1 - x2))
    if angle < 0: angle += 360

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

def track_pushups():
    cap = cv2.VideoCapture(0)
    
    direction = 0
    push_ups = 0
    ptime = 0
    start_time = time.time()
    
    print("Starting Advanced Pushup Tracker...")

    while True:
        success, img = cap.read()
        if not success: break
            
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(img_rgb)
        lm_list = []
        
        if results.pose_landmarks:
            mp_draw.draw_landmarks(img, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            for id, lm in enumerate(results.pose_landmarks.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                lm_list.append([id, cx, cy])
        
        if len(lm_list) != 0:
            # Angle tracking (Right: 12,14,16 | Left: 11,13,15)
            a1 = calculate_angle(img, 12, 14, 16, lm_list)
            a2 = calculate_angle(img, 11, 13, 15, lm_list)

            # Map angles (90 deg = 100% down, 170 deg = 0% up)
            # Using slightly relaxed thresholds for better UX
            per_val1 = np.interp(a1, (90, 160), (100, 0))
            per_val2 = np.interp(a2, (90, 160), (100, 0))

            # Bar height
            bar_val1 = np.interp(per_val1, (0, 100), (390, 40))
            bar_val2 = np.interp(per_val2, (0, 100), (390, 40))

            # Draw Bars
            cv2.rectangle(img, (580, int(bar_val1)), (610, 390), (0, 255, 0), cv2.FILLED)
            cv2.rectangle(img, (580, 40), (610, 390), (0, 0, 0), 3)
            cv2.rectangle(img, (20, int(bar_val2)), (50, 390), (0, 255, 0), cv2.FILLED)
            cv2.rectangle(img, (20, 40), (50, 390), (0, 0, 0), 3)

            # Percentage Text
            cv2.putText(img, f'{int(per_val1)}%', (560, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0,0,255), 2)
            cv2.putText(img, f'{int(per_val2)}%', (20, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0,0,255), 2)

            # Repetition Logic
            if per_val1 >= 90 and per_val2 >= 90:
                if direction == 0:
                    push_ups += 0.5
                    direction = 1
            if per_val1 <= 10 and per_val2 <= 10:
                if direction == 1:
                    push_ups += 0.5
                    direction = 0
            
            # Display Count
            cv2.putText(img, f"Pushups: {int(push_ups)}", (220, 50), cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 0), 3)

        # FPS
        ctime = time.time()
        fps = 1 / (ctime - ptime) if (ctime - ptime) > 0 else 0
        ptime = ctime
        cv2.putText(img, f"FPS: {int(fps)}", (10, 470), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 255), 2)

        cv2.imshow("RapiReport AI Pushup Tracker", img)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    
    # Sync Logic
    total_reps = int(push_ups)
    if total_reps > 0:
        duration = int(time.time() - start_time)
        calories = (8.0 * 3.5 * 70 / 200) * (duration / 60.0)
        try:
            requests.post(API_URL, json={
                "user_id": USER_ID,
                "exercise_type": "pushup",
                "rep_count": total_reps,
                "duration_seconds": duration,
                "calories_burned": round(calories, 2),
                "verified": True
            })
            print(f"Synced {total_reps} pushups!")
        except Exception as e:
            print(f"Sync failed: {e}")

if __name__ == "__main__":
    track_pushups()
