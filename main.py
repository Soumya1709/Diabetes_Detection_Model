from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import pandas as pd
import shap

app = FastAPI()

# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # replace with your Vercel URL after deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
with open("diabetes_xgb_model.pkl", "rb") as f:
    model = pickle.load(f)
    print(model.feature_names_in_)

explainer = shap.TreeExplainer(model)

FEATURES = ["Pregnancies", "Glucose", "BloodPressure",
            "SkinThickness", "Insulin", "BMI",
            "DiabetesPedigreeFunction", "Age"]

class PatientData(BaseModel):
    Pregnancies:              float
    Glucose:                  float
    BloodPressure:            float
    SkinThickness:            float
    Insulin:                  float
    BMI:                      float
    DiabetesPedigreeFunction: float
    Age:                      float

@app.get("/")
def root():
    return {"status": "Diabetes prediction API is running"}

@app.post("/predict")
def predict(data: PatientData):

    patient = data.dict()

    # BMI categories
    bmi = patient["BMI"]

    patient["BMI_Category_Obese"] = int(bmi >= 30)
    patient["BMI_Category_Overweight"] = int(25 <= bmi < 30)
    patient["BMI_Category_Underweight"] = int(bmi < 18.5)

    # Age groups
    age = patient["Age"]

    patient["Age_Group_Senior"] = int(age > 50)
    patient["Age_Group_Young"] = int(age < 30)

    # EXACT order expected by model
    input_df = pd.DataFrame([patient])[[
        'Pregnancies',
        'Glucose',
        'BloodPressure',
        'SkinThickness',
        'Insulin',
        'BMI',
        'DiabetesPedigreeFunction',
        'Age',
        'BMI_Category_Obese',
        'BMI_Category_Overweight',
        'BMI_Category_Underweight',
        'Age_Group_Senior',
        'Age_Group_Young'
    ]]

    prob = float(model.predict_proba(input_df)[0][1])
    pred = int(prob >= 0.5)

    # SHAP
    sv = explainer(input_df)
    shap_vals = sv.values[0].tolist()
    base_val = float(sv.base_values[0])

    contributions = [
        {
            "feature": f,
            "value": float(input_df[f].iloc[0]),
            "shap": round(s, 4)
        }
        for f, s in zip(input_df.columns, shap_vals)
    ]

    contributions.sort(
        key=lambda x: abs(x["shap"]),
        reverse=True
    )

    return {
        "probability": round(prob, 4),
        "prediction": pred,
        "base_value": round(base_val, 4),
        "shap": contributions,
    }