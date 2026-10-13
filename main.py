import joblib
from fastapi import FastAPI
from pydantic import BaseModel,Field
import pandas as pd
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

model=joblib.load('Mental_Health_Model.pkl')
top_countries=['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# first pydentic base model
class StudentData(BaseModel):
    age: int=Field(..., gt=0,le=100, description="Age of the student")
    gender: Literal['Male', 'Female']
    country: str
    academic_Level: Literal['Undergraduate', 'Graduate', 'High School']
    most_Used_Platform: Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
       'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp',
       'WeChat']
    purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
    # mental_Health_Score: float=Field(..., ge=0, le=100, description="Mental health score of the student")
    avg_daily_Usage_Hours: float=Field(...,ge=0,le=24, description="Average daily usage hours of the student")
    daily_Unlocks:int= Field(...,ge=0, description="Daily unlocks of the student")
    study_Hours:float= Field(...,ge=0,le=24, description="Study hours of the student")
    physical_Activity_Hours: float=Field(...,ge=0,le=24, description="Physical activity hours of the student")
    sleep_Hours_Per_Night: float=Field(...,ge=0,le=24, description="Sleep hours per night of the student")
    stress_Level:Literal['Medium', 'Low', 'Very High', 'High']

# Response model
class PredictionResponse(BaseModel):
    predicted_mental_health_score:float

    
@app.get("/")
def greet():
    return "Hello! Welcome to the Mental Health Prediction API."


@app.post('/predict',response_model=PredictionResponse)
def predict(data:StudentData):
    country_grouped = data.country if data.country in top_countries else 'Other'
    input_row=pd.DataFrame([{
        
    'Age':data.age,
    'Gender':data.gender,
    'Country':data.country,
    'Academic_Level':data.academic_Level,
    'Most_Used_Platform':data.most_Used_Platform,
    'Purpose_Of_Use':data.purpose_Of_Use,
    'Avg_Daily_Usage_Hours':data.avg_daily_Usage_Hours,
    'Daily_Unlocks':data.daily_Unlocks,
    'Study_Hours':data.study_Hours,
    'Physical_Activity_Hours':data.physical_Activity_Hours,
    'Sleep_Hours_Per_Night':data.sleep_Hours_Per_Night,
    'Stress_Level':data.stress_Level,
    
    'Country_Grouped':country_grouped


    }])

    prediction=model.predict(input_row)[0]
    return PredictionResponse(predicted_mental_health_score=round(prediction, 2))
