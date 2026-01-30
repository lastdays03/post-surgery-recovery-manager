import json
from datetime import datetime, timedelta
import uuid

USER_ID = "85d6d6b1-5af0-4b6d-ba2c-66125102a808"
START_DATE = datetime(2026, 1, 1)
END_DATE = datetime(2026, 2, 28)
SURGERY_DATE = datetime(2026, 1, 28)

def generate_meal(meal_id, name, phase, time, calories, protein, carbs, fat):
    return {
        "id": meal_id,
        "name": name,
        "tags": ["영양식", "회복식"] if phase != "regular" else ["일반식", "건강식"],
        "phase": phase,
        "mealTime": time,
        "prepTime": 15 if phase == "liquid" else 30,
        "nutrition": {
            "fat": fat,
            "carbs": carbs,
            "protein": protein,
            "calories": calories
        },
        "ingredients": ["식재료 A", "식재료 B"],
        "portionSize": "1인분",
        "suitableFor": [],
        "instructions": ["재료를 준비합니다.", "조리법에 따라 요리합니다.", "천천히 섭취합니다."]
    }

def get_meals_for_phase(date, phase):
    if phase == "liquid":
        return [
            generate_meal("l-br", "아침: 쌀 미음", "liquid", "breakfast", 70, 1, 15, 0),
            generate_meal("l-lu", "점심: 맑은 채소 스프", "liquid", "lunch", 50, 1, 12, 0),
            generate_meal("l-di", "저녁: 닭고기 육수", "liquid", "dinner", 60, 3, 5, 1),
            generate_meal("l-sn1", "간식: 젤리 디저트", "liquid", "snack", 100, 2, 20, 0),
            generate_meal("l-sn2", "간식: 과일 주스", "liquid", "snack", 80, 0, 20, 0)
        ]
    elif phase == "soft":
        return [
            generate_meal("s-br", "아침: 계란찜과 흰죽", "soft", "breakfast", 250, 12, 40, 5),
            generate_meal("s-lu", "점심: 두부 조림과 무른 밥", "soft", "lunch", 350, 18, 50, 8),
            generate_meal("s-di", "저녁: 흰살 생선 구이와 야채죽", "soft", "dinner", 300, 20, 45, 6),
            generate_meal("s-sn", "간식: 요거트", "soft", "snack", 120, 6, 15, 4)
        ]
    else: # regular
        return [
            generate_meal("r-br", "아침: 잡곡밥과 고등어구이", "regular", "breakfast", 500, 25, 60, 15),
            generate_meal("r-lu", "점심: 비빔밥", "regular", "lunch", 600, 20, 80, 12),
            generate_meal("r-di", "저녁: 불고기와 쌈채소", "regular", "dinner", 550, 30, 50, 20),
            generate_meal("r-sn", "간식: 견과류", "regular", "snack", 150, 5, 10, 12)
        ]

sql_statements = []

current_date = START_DATE
while current_date <= END_DATE:
    days_diff = (current_date - SURGERY_DATE).days
    
    if days_diff < 0:
        phase = "regular"
    elif days_diff <= 7:
        phase = "liquid"
    elif days_diff <= 21:
        phase = "soft"
    else:
        phase = "regular"
        
    meals = get_meals_for_phase(current_date, phase)
    date_str = current_date.strftime('%Y-%m-%d')
    plan_id = str(uuid.uuid4())
    created_at = current_date.replace(hour=9, minute=0, second=0).isoformat() + "+00"
    
    meals_json = json.dumps(meals, ensure_ascii=False)
    
    sql = f"""INSERT INTO "public"."meal_plans" ("id", "user_id", "date", "recovery_phase", "meals", "preferences", "created_at", "updated_at") VALUES ('{plan_id}', '{USER_ID}', '{date_str}', '{phase}', '{meals_json}', null, '{created_at}', '{created_at}');"""
    sql_statements.append(sql)
    
    current_date += timedelta(days=1)

with open("meal_plans_sample.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_statements))

print("SQL file 'meal_plans_sample.sql' has been generated.")
