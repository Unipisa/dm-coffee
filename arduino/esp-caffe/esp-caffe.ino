#include "credentials.h"

#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <string.h>

extern "C" {
  #include "user_interface.h"
  #include "wpa2_enterprise.h"
}

#define SS_PIN D8
#define RST_PIN 0

#define API_URL "https://coffee.dm.unipi.it/graphql"
#define LCD_TIMEOUT 5000

#define COFFEE_STRING "   --- Coffee ---   "

MFRC522 mfrc522(SS_PIN, RST_PIN); // Instance of the class

// set the LCD number of columns and rows
int lcdColumns = 20;
int lcdRows = 4;

// Last message displayed -- used to clear the screen if too old, 
// we store one timestamp per line
long lastMessage = 0L;
bool dirtyScreen = false;

// set LCD address, number of columns and rows
// if you don't know your display address, run an I2C scanner sketch
LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);

void lcdPrintLines(String x) {
  const char *y = x.c_str();
  int line = 1;
  char buf[21];

  while (line < 4 && y) {
    const char *newline = strchr(y, '\n');
    if (! newline) {
      strncpy(buf, y, 20); buf[20] = '\0';
      lcdPrintLine(line, String(buf));
      break;
    }
    else {
      strncpy(buf, y, newline - y);
      buf[newline - y] = '\0';
      lcdPrintLine(line, String(buf));
      y = newline + 1;
    }

    line++;
  }
}


void lcdPrintLine(int line, String x) {
  Serial.println(String("LCD: Printing on line ") + line);
  Serial.println(x);

  dirtyScreen =  true;

  if (line < 0 || line > lcdRows) {
    return;
  }

  lcd.setCursor(0, line);
  lcd.print("                ");
  lcd.setCursor(0, line);
  lcd.print(x);
  lastMessage = millis();
}

void cleanupScreen() { 
  if (dirtyScreen && (millis() > lastMessage + LCD_TIMEOUT)) {
    for (int j = 0; j < lcdRows; j++) {    
      lcd.setCursor(0, j);
      if (j == 0)
        lcd.print(COFFEE_STRING);
      if (j == 1)
        lcd.print(" [ Scan the badge ] ");
      if (j > 1)
        lcd.print("                    ");
    }

    dirtyScreen = false;
  }

  
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED)
    return;

  lcd.clear();
  lcdPrintLine(0, COFFEE_STRING);
  lcdPrintLine(1, "> Connecting to WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    lcdPrintLine(1, "> Connecting to WiFi");
    delay(2000);
  }
  lcdPrintLine(1, "> Connected           ");
  delay(1000);
}

void setup() {
  Serial.begin(9600);

  SPI.begin(); // Init SPI bus
  mfrc522.PCD_Init(); // Init MFRC522

  Serial.println();
  delay(4);
  mfrc522.PCD_DumpVersionToSerial();

  // initialize LCD
  lcd.init();
  // turn on LCD backlight                      
  lcd.backlight();
  lcdPrintLine(0, COFFEE_STRING);

  if (! mfrc522.PCD_PerformSelfTest()) {
    Serial.println("The self test of the MFRC522 module has not passed.");
    lcdPrintLine(1, "NFC test failed!");
  }

  pinMode(D0, OUTPUT);
}

void loop() {

  connectWiFi();

  bool gotNewCard = mfrc522.PICC_IsNewCardPresent();
  bool gotSerial = mfrc522.PICC_ReadCardSerial();

  if (gotNewCard && gotSerial) {
    lcd.clear();
    lcdPrintLine(0, "> [wait]");
    WiFiClientSecure client;
    client.setInsecure();
    
    HTTPClient https;
    String data = "";
    for (uint8_t i = 0; i < 4; i++) {
        data = data + String(mfrc522.uid.uidByte[i], HEX);
    }
    // data = String("{ \"code\": \"") + data + String("\" }");

    data = String("{\"operationName\":\"Card\",\"variables\":{\"code\":\"") + 
      data +
      String("\"},\"query\":\"mutation Card($code: String!) {card(code: $code)}\"}");

    Serial.println(data);

    String fullUrl = API_URL;
    lcdPrintLine(1, "Registering 1 coffee");
    lcdPrintLine(2, "     [ ...... ]     ");

    if (https.begin(client, fullUrl)) {
      https.addHeader("Content-Type", "application/json");
      https.addHeader("Authorization", SECRET_TOKEN);
      int httpCode = https.POST(data);
      Serial.println("Response received");
      if (httpCode > 0) {
        JsonDocument doc;
        String body = https.getString();
        Serial.println(body);
        deserializeJson(doc, body);
        String response = doc["data"]["card"];

        // We need to split the string finding the newline, if any
        lcd.clear();
        lcdPrintLine(0, COFFEE_STRING);
        lcdPrintLines(response);

        tone(D0, 6000, 200);
        delay(300);
        tone(D0, 6000, 200);
      }
      https.end();
    } else {      
      lcdPrintLine(0, "Request failed");
      lcdPrintLine(1, "");
    }
  }

  // Cleanup screen
  cleanupScreen();

  delay(4);  
}
