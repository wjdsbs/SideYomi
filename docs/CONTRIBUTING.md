# Contributing

## 브랜치

```
main      — 릴리즈 전용, 직접 push 금지
develop   — 통합 브랜치, feature들의 머지 대상
feature/N-slug   — 기능 개발 (develop에서 분기)
hotfix/slug      — main 긴급 수정 (main + develop 양쪽 머지)
chore/slug       — 빌드·설정·문서
```

브랜치명은 소문자 + 하이픈. 이슈 번호를 앞에 붙인다.

```bash
git checkout develop
git checkout -b feature/3-kuromoji-lazy-load
```

## 커밋

Angular Commit Message 형식을 따른다.
설명은 한글로 작성

```
type(scope): 변경 내용 요약

[선택 — 무엇을, 왜 변경했는지]

[선택 — Closes #N]
```

**type**

| type       | 용도                  |
| ---------- | --------------------- |
| `feat`     | 새로운 기능           |
| `fix`      | 버그 수정             |
| `chore`    | 빌드·설정·도구        |
| `refactor` | 동작 변경 없는 리팩터 |
| `docs`     | 문서만 변경           |
| `style`    | 포맷·공백             |
| `perf`     | 성능 개선             |
| `test`     | 테스트 추가·수정      |

**scope**

`sidepanel` `content` `background` `wordbook` `settings` `jmdict` `kuromoji` `kuroshiro` `gemini` `anki` `build` `manifest`

**예시**

```
feat(kuromoji): lazy-load singleton 초기화 추가

설치 시가 아닌 첫 텍스트 선택 시점에 토크나이저를 초기화.
모듈 레벨 변수에 인스턴스를 저장해 리렌더링 후에도 유지.

Closes #3
```

## PR

- base 브랜치는 항상 `develop`
- 제목은 커밋 메시지 형식과 동일하게 (`feat(scope): ... — close #N`)
- `develop → main` 머지 시에만 버전 태그 추가

**머지 전략**

| 상황                          | 전략             |
| ----------------------------- | ---------------- |
| `feature` → `develop`         | Squash and merge |
| `develop` → `main`            | Merge commit     |
| `hotfix` → `main` + `develop` | Merge commit     |

**PR 체크리스트**

- [ ] `pnpm build` 통과
- [ ] Side Panel 동작 확인
- [ ] DOM 수정 없음
- [ ] API 키 하드코딩 없음
- [ ] `console.log` 제거
