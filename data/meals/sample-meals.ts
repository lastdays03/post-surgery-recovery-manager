import type { Meal } from '@/lib/types/meal.types'

export const SAMPLE_MEALS: Meal[] = [
    // Liquid Phase Meals
    {
        id: 'liquid-breakfast-1',
        name: '단백질 보충 유동식',
        phase: 'liquid',
        mealTime: 'breakfast',
        nutrition: {
            calories: 150,
            protein: 15,
            fat: 3,
            carbs: 18
        },
        ingredients: [
            '저지방 우유 200ml',
            '단백질 파우더 1스푼',
            '꿀 1작은술'
        ],
        instructions: [
            '우유를 미지근하게 데운다',
            '단백질 파우더를 천천히 섞는다',
            '꿀을 추가하여 부드럽게 섞는다',
            '천천히 마신다'
        ],
        prepTime: 5,
        portionSize: '200ml',
        notes: '한 번에 천천히 마시고, 30분 이상 소요하세요'
    },
    {
        id: 'liquid-lunch-1',
        name: '맑은 야채 수프',
        phase: 'liquid',
        mealTime: 'lunch',
        nutrition: {
            calories: 80,
            protein: 3,
            fat: 2,
            carbs: 12
        },
        ingredients: [
            '당근 50g',
            '양파 30g',
            '셀러리 20g',
            '물 300ml',
            '소금 약간'
        ],
        instructions: [
            '야채를 잘게 썬다',
            '물에 넣고 30분간 끓인다',
            '건더기를 걸러내고 국물만 사용',
            '미지근하게 식혀서 섭취'
        ],
        prepTime: 40,
        portionSize: '250ml',
        notes: '건더기는 제거하고 맑은 국물만 드세요'
    },

    // Pureed Phase Meals
    {
        id: 'pureed-breakfast-1',
        name: '부드러운 스크램블 에그',
        phase: 'pureed',
        mealTime: 'breakfast',
        nutrition: {
            calories: 180,
            protein: 18,
            fat: 12,
            carbs: 3
        },
        ingredients: [
            '계란 2개',
            '저지방 우유 2큰술',
            '버터 1작은술',
            '소금 약간'
        ],
        instructions: [
            '계란과 우유를 잘 섞는다',
            '약한 불에 버터를 녹인다',
            '계란물을 넣고 부드럽게 저으며 익힌다',
            '매우 부드러운 상태로 만든다'
        ],
        prepTime: 10,
        portionSize: '1인분',
        notes: '아주 부드럽게 익혀서 드세요'
    },
    {
        id: 'pureed-lunch-1',
        name: '감자 퓌레',
        phase: 'pureed',
        mealTime: 'lunch',
        nutrition: {
            calories: 200,
            protein: 5,
            fat: 8,
            carbs: 28
        },
        ingredients: [
            '감자 200g',
            '저지방 우유 50ml',
            '버터 1큰술',
            '소금 약간'
        ],
        instructions: [
            '감자를 삶아서 부드럽게 만든다',
            '으깬 감자에 우유를 조금씩 넣으며 섞는다',
            '버터를 넣고 부드럽게 만든다',
            '덩어리가 없도록 잘 으깬다'
        ],
        prepTime: 25,
        portionSize: '1컵',
        notes: '완전히 부드러운 퓌레 상태로 만드세요'
    },

    // Soft Phase Meals
    {
        id: 'soft-breakfast-1',
        name: '부드러운 오트밀',
        phase: 'soft',
        mealTime: 'breakfast',
        nutrition: {
            calories: 220,
            protein: 10,
            fat: 6,
            carbs: 35,
            fiber: 4
        },
        ingredients: [
            '오트밀 40g',
            '저지방 우유 200ml',
            '바나나 1/2개',
            '꿀 1작은술'
        ],
        instructions: [
            '오트밀을 우유에 불린다',
            '중불에서 5분간 저으며 익힌다',
            '으깬 바나나를 추가한다',
            '꿀을 넣고 섞는다'
        ],
        prepTime: 10,
        portionSize: '1그릇',
        notes: '충분히 부드럽게 익혀서 드세요'
    },
    {
        id: 'soft-lunch-1',
        name: '닭가슴살 죽',
        phase: 'soft',
        mealTime: 'lunch',
        nutrition: {
            calories: 280,
            protein: 25,
            fat: 5,
            carbs: 35
        },
        ingredients: [
            '쌀 80g',
            '닭가슴살 100g (잘게 다진 것)',
            '물 500ml',
            '참기름 1작은술',
            '소금 약간'
        ],
        instructions: [
            '쌀을 불려서 준비한다',
            '물에 쌀을 넣고 끓인다',
            '닭가슴살을 추가하여 함께 익힌다',
            '부드러운 죽 상태가 될 때까지 저으며 끓인다',
            '참기름으로 마무리'
        ],
        prepTime: 40,
        portionSize: '1그릇',
        notes: '고기는 아주 잘게 다져서 넣으세요'
    },

    // Regular Phase Meals
    {
        id: 'regular-breakfast-1',
        name: '건강한 샌드위치',
        phase: 'regular',
        mealTime: 'breakfast',
        nutrition: {
            calories: 350,
            protein: 20,
            fat: 12,
            carbs: 42,
            fiber: 6
        },
        ingredients: [
            '통밀빵 2장',
            '삶은 계란 1개',
            '양상추',
            '토마토 슬라이스',
            '저지방 마요네즈 1큰술'
        ],
        instructions: [
            '빵을 가볍게 토스트한다',
            '계란을 으깨서 마요네즈와 섞는다',
            '빵 위에 재료를 차례로 올린다',
            '잘게 잘라서 먹는다'
        ],
        prepTime: 15,
        portionSize: '1인분',
        notes: '천천히 잘 씹어서 드세요'
    },
    {
        id: 'regular-lunch-1',
        name: '구운 연어와 야채',
        phase: 'regular',
        mealTime: 'lunch',
        nutrition: {
            calories: 420,
            protein: 35,
            fat: 20,
            carbs: 28,
            fiber: 5
        },
        ingredients: [
            '연어 150g',
            '브로콜리 100g',
            '고구마 100g',
            '올리브오일 1큰술',
            '레몬즙',
            '소금, 후추'
        ],
        instructions: [
            '연어에 소금, 후추로 간을 한다',
            '180도 오븐에서 15분간 굽는다',
            '브로콜리를 쪄서 준비한다',
            '고구마를 삶거나 굽는다',
            '레몬즙을 뿌려 마무리'
        ],
        prepTime: 30,
        portionSize: '1인분',
        notes: '균형잡힌 영양소로 구성된 식사입니다'
    },

    // Snacks
    {
        id: 'liquid-snack-1',
        name: '과일 주스',
        phase: 'liquid',
        mealTime: 'snack',
        nutrition: {
            calories: 60,
            protein: 1,
            fat: 0,
            carbs: 15
        },
        ingredients: [
            '사과 1/2개',
            '물 100ml'
        ],
        instructions: [
            '사과를 갈아서 즙을 낸다',
            '물과 섞는다',
            '건더기를 걸러낸다'
        ],
        prepTime: 10,
        portionSize: '150ml',
        notes: '맑은 즙만 섭취하세요'
    },
    {
        id: 'pureed-snack-1',
        name: '요거트',
        phase: 'pureed',
        mealTime: 'snack',
        nutrition: {
            calories: 120,
            protein: 10,
            fat: 3,
            carbs: 15
        },
        ingredients: [
            '플레인 요거트 150g',
            '꿀 1작은술'
        ],
        instructions: [
            '요거트에 꿀을 섞는다',
            '부드럽게 저어서 먹는다'
        ],
        prepTime: 2,
        portionSize: '150g',
        notes: '저지방 제품을 선택하세요'
    },
    {
        id: 'soft-snack-1',
        name: '바나나',
        phase: 'soft',
        mealTime: 'snack',
        nutrition: {
            calories: 105,
            protein: 1,
            fat: 0,
            carbs: 27,
            fiber: 3
        },
        ingredients: [
            '바나나 1개'
        ],
        instructions: [
            '바나나를 으깨서 먹는다'
        ],
        prepTime: 2,
        portionSize: '1개',
        notes: '잘 익은 것을 선택하세요'
    },
    {
        id: 'regular-snack-1',
        name: '견과류 믹스',
        phase: 'regular',
        mealTime: 'snack',
        nutrition: {
            calories: 180,
            protein: 6,
            fat: 15,
            carbs: 8,
            fiber: 3
        },
        ingredients: [
            '아몬드 15g',
            '호두 10g',
            '건포도 5g'
        ],
        instructions: [
            '견과류를 잘 씹어서 먹는다'
        ],
        prepTime: 1,
        portionSize: '30g',
        notes: '천천히 잘 씹어서 드세요'
    },
    // Enhanced Meal Database (v2.0) - Specialized surgery-specific meals
    {
        id: 'bariatric-snack-1',
        name: '그릭요거트 프로틴 무스',
        phase: 'soft',
        mealTime: 'snack',
        suitableFor: ['gastric_resection', 'esophagectomy', 'bariatric'],
        nutrition: {
            calories: 180,
            protein: 15,
            fat: 4,
            carbs: 8,
            fiber: 0
        },
        ingredients: [
            '무가당 그릭요거트 100g',
            '웨이 프로틴 파우더(바닐라) 1/2스쿱',
            '레몬즙 약간'
        ],
        instructions: [
            '그릭요거트에 프로틴 파우더를 넣고 덩어리가 없을 때까지 섞는다.',
            '너무 뻑뻑하면 물이나 저지방 우유를 1티스푼 넣는다.',
            '아주 작은 티스푼으로 20분 이상 천천히 섭취한다.'
        ],
        prepTime: 3,
        portionSize: '120g',
        tags: ['고단백', '저당분', '덤핑예방'],
        notes: '위절제 후 덤핑증후군 예방을 위해 설탕이 없는 제품을 사용하고, 식사 30분 후 섭취하세요.'
    },
    {
        id: 'low-residue-dinner-1',
        name: '부드러운 닭고기 장조림과 흰죽',
        phase: 'soft',
        mealTime: 'dinner',
        suitableFor: ['colon_resection', 'general'],
        nutrition: {
            calories: 320,
            protein: 20,
            fat: 5,
            carbs: 45,
            fiber: 1
        },
        ingredients: [
            '닭안심 100g',
            '흰쌀죽 1공기',
            '간장(저염)',
            '메추리알 2개'
        ],
        instructions: [
            '닭안심은 결대로 잘게 찢어질 때까지 푹 삶는다.',
            '간장과 물을 1:3 비율로 섞어 닭고기와 메추리알을 넣고 조린다.',
            '질긴 섬유질이 있는 파, 마늘 등의 건더기는 조리 후 제거한다.',
            '흰죽과 함께 천천히 씹어 먹는다.'
        ],
        prepTime: 30,
        portionSize: '1인분',
        tags: ['저잔사식', '고단백', '소화용이'],
        notes: '장 수술 후 장폐색 예방을 위해 깨, 고춧가루, 질긴 채소 사용을 금합니다.'
    },
    {
        id: 'low-fat-lunch-1',
        name: '대구살 무찜 (기름기 제로)',
        phase: 'regular',
        mealTime: 'lunch',
        suitableFor: ['cholecystectomy', 'gastric_resection'],
        nutrition: {
            calories: 250,
            protein: 22,
            fat: 2,
            carbs: 15,
            fiber: 3
        },
        ingredients: [
            '대구살 또는 동태살 150g',
            '무 100g',
            '미나리 약간 (잎 부분만)',
            '멸치 육수'
        ],
        instructions: [
            '무를 얇게 썰어 냄비 바닥에 깐다.',
            '그 위에 흰살생선을 올리고 멸치 육수를 자작하게 붓는다.',
            '기름을 전혀 사용하지 않고 찜 형태로 익힌다.',
            '소화가 잘 되도록 무가 투명해질 때까지 충분히 익힌다.'
        ],
        prepTime: 25,
        portionSize: '1인분',
        tags: ['저지방', '가스제한', '속편한'],
        notes: '담낭 절제 후 지방 소화가 어려우므로 식용유나 참기름 사용을 제한했습니다.'
    },
    {
        id: 'ortho-recovery-1',
        name: '연어 스테이크와 두부 구이',
        phase: 'regular',
        mealTime: 'dinner',
        suitableFor: ['tkr', 'acl_reconstruction', 'spinal_fusion'],
        nutrition: {
            calories: 550,
            protein: 35,
            fat: 20,
            carbs: 40,
            fiber: 6
        },
        ingredients: [
            '연어 150g',
            '두부 1/4모',
            '브로콜리 50g',
            '현미밥 2/3공기',
            '올리브오일'
        ],
        instructions: [
            '연어와 두부는 물기를 제거하고 올리브오일을 발라 굽는다.',
            '브로콜리는 살짝 데쳐서 준비한다.',
            '수술 후 활동량이 줄어든 상태라면 밥 양을 조절한다.'
        ],
        prepTime: 20,
        portionSize: '1인분',
        tags: ['고단백', '항염식단', '오메가3', '칼슘강화'],
        notes: '근육 손실 방지를 위한 고단백 식단이며, 연어의 오메가-3는 관절 염증 완화에 도움이 됩니다.'
    },
    {
        id: 'eye-health-smoothie',
        name: '아이 케어 당근 베리 스무디',
        phase: 'regular',
        mealTime: 'breakfast',
        suitableFor: ['smile_lasik', 'general'],
        nutrition: {
            calories: 180,
            protein: 5,
            fat: 2,
            carbs: 35,
            fiber: 5
        },
        ingredients: [
            '당근 1/2개 (비타민A)',
            '블루베리 1/2컵 (안토시아닌)',
            '케일 2장 (루테인)',
            '코코넛워터 200ml'
        ],
        instructions: [
            '당근은 깍둑썰기하고 케일은 씻어서 준비한다.',
            '모든 재료를 블렌더에 넣고 곱게 간다.',
            '수술 초기 눈에 힘이 들어가지 않도록 빨대 사용은 주의한다(압력).'
        ],
        prepTime: 5,
        portionSize: '300ml',
        tags: ['눈건강', '항산화', '비타민A'],
        notes: '각막 회복과 안구 건조 완화에 도움을 주는 항산화 성분이 풍부합니다.'
    }
]
