#!/usr/bin/env python
import os, datetime, time
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup(14, GPIO.IN)

print "Starting Sensor"

lastDetect = time.time()
lastAction = ""
threshold = 5 # 5 second threshold

while time.time() < lastDetect + threshold:
        if GPIO.input(14):
                print("Arm not in Sensor Range")
                if lastAction != "Nothing":
                        lastAction = "Nothing"
                        lastDetect = time.time()
        else:
                print("Arm in Sensor Range")
                if lastAction != "Movement":
                        lastAction = "Movement"
                        lastDetect = time.time() #reset lastDetect

        time.sleep(0.2) #sleep for half a second

print("No movement in last 5 seconds.. throw red flag!!!!")
