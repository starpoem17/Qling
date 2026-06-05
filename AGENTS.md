## Deep module

Keep architecture in deep modules. Not a number of shallow modules

## 보고 양식

보고할 사항이 있으면 md 파일 대신 html로 보고한다. html 파일은 한국어로 작성한다.

## 배포 및 브랜치 운영

앞으로의 커밋은 `main`에 직접 올리지 않는다. 변경 작업은 먼저 별도 브랜치에서 진행하고, Pull Request는 Render manual preview 스타일로 프리뷰 배포를 만들 수 있게 준비한다.

프리뷰가 필요한 PR은 제목에 `[render preview]`를 포함하거나 Render의 manual preview 트리거 방식을 사용한다. 프리뷰에서 유저 테스트와 확인이 끝난 뒤, 마지막에 유저의 명시적인 허락을 받고 `main`에 merge한다.