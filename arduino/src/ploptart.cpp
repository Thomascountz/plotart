#include <AccelStepper.h>
#include <MultiStepper.h>

#define ONE_REVOLUTION 4095
#define DISTANCE_PER_REVOLUTION 55.0
#define MOTOR_DISTANCE 235
#define PEN_Y_OFFSET -37.50
#define HOME_LENGTHS 139.396
#define HOME_STEP_COUNT 0

AccelStepper stepperRight(AccelStepper::HALF4WIRE, 8, 10, 9, 11);
AccelStepper stepperLeft(AccelStepper::HALF4WIRE, 4, 6, 5, 7);
MultiStepper multiStepper;

unsigned long lastTelemetryTime = 0;
const unsigned long telemetryInterval = 100; // ms

// Function declarations
void processCommand(String command);
void sendTelemetry();

void setup()
{
    Serial.begin(115200);

    stepperRight.setMaxSpeed(750);
    stepperRight.setSpeed(750);
    stepperRight.setCurrentPosition(-HOME_STEP_COUNT);
    stepperRight.setAcceleration(250);

    stepperLeft.setMaxSpeed(750);
    stepperLeft.setSpeed(750);
    stepperLeft.setCurrentPosition(HOME_STEP_COUNT);
    stepperLeft.setAcceleration(250);

    multiStepper.addStepper(stepperLeft);
    multiStepper.addStepper(stepperRight);
}

void loop()
{

    if (Serial.available() > 0)
    {
        if (Serial.peek() == 'T')
        {

            Serial.read(); // Consume the 'T'
            sendTelemetry();
        }
        else
        {
            String command = Serial.readStringUntil('\n');
            processCommand(command);
        }
    }

    multiStepper.run();
}

void processCommand(String command)
{
    if (command.startsWith("M "))
    {
        long leftPosition, rightPosition;
        sscanf(command.c_str(), "M %ld %ld", &leftPosition, &rightPosition);
        long positions[2] = {leftPosition, rightPosition};
        multiStepper.moveTo(positions);
    }
}

void sendTelemetry()
{
    Serial.print(stepperLeft.currentPosition());
    Serial.print(",");
    Serial.println(stepperRight.currentPosition());
}