import { Font } from '@react-pdf/renderer'

/**
 * PDF 생성을 위한 한글 폰트(Noto Sans KR)를 등록합니다.
 * @react-pdf/renderer는 로컬 폰트 파일 또는 웹 URL을 지원합니다.
 */
export function registerFonts() {
    Font.register({
        family: 'NanumGothic',
        fonts: [
            {
                src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf',
                fontWeight: 'normal',
            },
            {
                src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Bold.ttf',
                fontWeight: 'bold',
            },
        ],
    })
}

// 초기화 호출
registerFonts()
