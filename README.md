# Obsidian Task Sync

## Main feature

- 마크다운 문서 내 Task(`- [ ] [Task Title](gtask:task-id)`)를 Google Tasks와 양방향 동기화
- Google Tasks에서 변경된 Task 상태를 Obsidian 문서에 반영
- Obsidian에서 Task를 수정하면 Google Tasks에도 자동 반영
- 명령어(Command Palette) 및 리본 아이콘을 통한 Task 동기화/생성 지원
- Google OAuth2 인증 지원

## Installation

1. 플러그인 설치

   - 이 저장소를 클론하거나 다운로드하여 Obsidian 플러그인 폴더(`.obsidian/plugins/your-plugin-id/`)에 복사합니다.
   - `npm install` 후 `npm run dev`로 개발 모드에서 빌드할 수 있습니다.

2. **Google API 인증 정보 입력**

   - 플러그인 설정에서 Google API Client ID와 Secret을 입력합니다.
   - 최초 인증 시 Google 계정 로그인이 필요합니다.

3. **Task 동기화**
   - 명령어 팔레트(Command Palette)에서 "Turn into Google Task" 또는 "동기화" 명령을 실행합니다.
   - 마크다운 문서 내 Task가 Google Tasks와 동기화됩니다.

## 마크다운 Task 포맷

```markdown
- [ ] [Task 제목](gtask:task-id)
- [x] [완료된 Task](gtask:task-id)
```

- `[ ]` : 미완료, `[x]` : 완료
- `gtask:task-id`는 Google Task의 고유 ID입니다.

## 기여 및 문의

- 외부기여를 환영합니다.
- 자세한 API 문서는 [Obsidian API 문서](https://github.com/obsidianmd/obsidian-api)를 참고하세요.
