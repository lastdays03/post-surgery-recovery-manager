# 🤝 협업 가이드 (Collaboration Guide)

우리 팀은 **Git-Flow 전략**과 **Conventional Commits**를 따릅니다.

## 1. Git 브랜치 전략

- **`main`**: 언제든 배포 가능한 안정 버전. (직접 push 금지, PR로만 병합)
- **`develop`**: 개발 중인 기능이 모이는 통합 브랜치.
- **`feature/*`**: 개별 기능을 개발하는 브랜치.
  - **명명 규칙**: `feature/이슈번호-기능명` (예: `feature/1-login-page`)

## 2. 커밋 메시지 규칙 (Conventional Commits)

커밋 메시지는 `타입: 제목` 형식을 따릅니다.

- **`feat`**: 새로운 기능 추가 (예: `feat: 회원가입 API 구현`)
- **`fix`**: 버그 수정
- **`docs`**: 문서 수정 (README, Docstring 등)
- **`refactor`**: 코드 리팩토링 (기능 변경 없음)
- **`test`**: 테스트 코드 추가/수정
- **`chore`**: 설정 변경, 패키지 매니저 등
