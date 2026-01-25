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
    }
]
