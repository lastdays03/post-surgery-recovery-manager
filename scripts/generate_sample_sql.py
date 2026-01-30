
import json
from datetime import datetime, timedelta
import random

USER_ID = "85d6d6b1-5af0-4b6d-ba2c-66125102a808"
PROFILE_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d471" # Generating a fixed profile ID for the sample
START_DATE = datetime(2025, 12, 30)
END_DATE = datetime(2026, 3, 1)
SURGERY_DATE = datetime(2026, 1, 1)

def generate_meal(id_val, name, phase, time, calories, protein, carbs, fat):
    return {
        "id": f"meal-{id_val}",
        "name": name,
        "phase": phase,
        "mealTime": time,
        "nutrition": {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat
        },
        "ingredients": ["식재료 1", "식재료 2"],
        "instructions": ["조리 단계 1", "조리 단계 2"],
        "prepTime": 15,
        "portionSize": "1인분"
    }

def get_recovery_data(date):
    days_from_surgery = (date - SURGERY_DATE).days
    
    if days_from_surgery < 0: # Pre-surgery (hypothetically preparing or just normal)
        return "regular", 2, 8, "good", "none", "none"
    elif days_from_surgery <= 7: # Acute post-op
        return "liquid", 7, 3, "bad", "bloating", "none"
    elif days_from_surgery <= 30: # Soft phase
        return "soft", 4, 6, "moderate", "none", "none"
    else: # Regular phase
        return "regular", 1, 9, "good", "none", "none"

sql_commands = []

current_date = START_DATE
while current_date <= END_DATE:
    date_str = current_date.strftime('%Y-%m-%d')
    phase, pain, energy, intake, post_meal, bowel = get_recovery_data(current_date)
    
    # 3. Meal Plans (Focusing only on this as requested)
    if phase == "liquid":
        meals = [
            generate_meal(1, "미음", "liquid", "breakfast", 150, 5, 30, 2),
            generate_meal(2, "채수", "liquid", "lunch", 120, 2, 25, 1),
            generate_meal(3, "단호박 미음", "liquid", "dinner", 180, 4, 35, 2)
        ]
    elif phase == "soft":
        meals = [
            generate_meal(4, "흰죽", "soft", "breakfast", 250, 8, 50, 3),
            generate_meal(5, "계란찜과 무른 밥", "soft", "lunch", 350, 15, 60, 10),
            generate_meal(6, "두부 조림과 야채죽", "soft", "dinner", 300, 12, 55, 6)
        ]
    else:
        meals = [
            generate_meal(7, "잡곡밥과 고등어구이", "regular", "breakfast", 500, 25, 70, 15),
            generate_meal(8, "소고기 미역국과 밥", "regular", "lunch", 600, 30, 80, 20),
            generate_meal(9, "닭가슴살 샐러드", "regular", "dinner", 450, 35, 40, 12)
        ]
        
    sql_commands.append(f"""
INSERT INTO meal_plans (user_id, date, recovery_phase, meals)
VALUES ('{USER_ID}', '{date_str}', '{phase}', '{json.dumps(meals, ensure_ascii=False)}')
ON CONFLICT (user_id, date) DO UPDATE SET recovery_phase = EXCLUDED.recovery_phase, meals = EXCLUDED.meals;
    """.strip())

    current_date += timedelta(days=1)

with open("sample_data.sql", "w", encoding="utf-8") as f:
    f.write("\n\n".join(sql_commands))
