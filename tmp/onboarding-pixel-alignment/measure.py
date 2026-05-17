from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Iterable

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "tmp" / "onboarding-pixel-alignment"
REFERENCE = ROOT / "design" / "reference" / "screenshots"


def bbox_for_non_colors(image: Image.Image, colors: Iterable[tuple[int, int, int]]) -> tuple[int, int, int, int] | None:
    ignored = set(colors)
    pixels = image.convert("RGB").load()
    width, height = image.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] not in ignored:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def dominant_colors(path: Path, count: int = 4) -> list[tuple[str, int]]:
    image = Image.open(path).convert("RGB")
    colors = Counter(image.getdata()).most_common(count)
    return [(f"#{r:02x}{g:02x}{b:02x}", total) for (r, g, b), total in colors]


def image_summary(path: Path) -> dict[str, object]:
    image = Image.open(path).convert("RGB")
    dominant = dominant_colors(path)
    ignored = [(255, 247, 227), (255, 139, 13), (255, 241, 209)]
    return {
        "size": f"{image.size[0]}x{image.size[1]}",
        "dominant": dominant,
        "non_bg_bbox": bbox_for_non_colors(image, ignored),
    }


IMPLEMENTED = {
    "03": {
        "size": "393x852",
        "status/time": "(30,18)-(74,34)",
        "header title": "(165,70)-(222,87)",
        "question badge": "(30,127)-(118,147)",
        "main title": "(28,141)-(253,175)",
        "progress": "(24,235)-(369,241)",
        "subtitle": "(24,258)-(350,277)",
        "nickname input": "(22,339)-(367,399)",
        "gender boxes": "(22,452)-(367,512)",
        "age input": "(22,580)-(367,640)",
        "CTA": "(24,752)-(369,808)",
    },
    "04": {
        "size": "393x852",
        "duplicate message": "(89,308)-(365,323)",
        "red error/input bbox": "(22,308)-(367,399)",
        "other major boxes": "03과 동일",
    },
    "05": {
        "size": "393x852",
        "header title": "(171,70)-(228,87)",
        "question badge": "(30,127)-(120,147)",
        "main title": "(28,141)-(287,175)",
        "subtitle/helper": "(24,258)-(365,296)",
        "chip grid outer": "(34,322)-(358,708)",
        "chip size/gap": "각 103x44, gap-x 7, gap-y 13",
        "previous CTA": "(24,752)-(120,808)",
        "complete CTA": "(130,752)-(369,808)",
    },
}

REFERENCE_FILES = {
    "03": REFERENCE / "onboarding-basic.png",
    "04": REFERENCE / "onboarding-duplicate.png",
    "05": REFERENCE / "onboarding-interests.png",
}


def render_measurements() -> str:
    rows: list[str] = []
    for screen, path in REFERENCE_FILES.items():
      summary = image_summary(path)
      dominant = ", ".join(f"{color} {total}px" for color, total in summary["dominant"])
      rows.append(
          f"<tr><td>{screen}</td><td>PNG fresh</td><td>{summary['size']}</td>"
          f"<td>{dominant}</td><td>{summary['non_bg_bbox']}</td><td>구현 좌표와 비교 기준</td></tr>"
      )
      for item, value in IMPLEMENTED[screen].items():
          rows.append(
              f"<tr><td>{screen}</td><td>{item}</td><td colspan='3'>{value}</td>"
              f"<td>OnboardingScreen.tsx absolute 좌표</td></tr>"
          )
      production = OUT / f"{screen}-production.png"
      if production.exists():
          production_summary = image_summary(production)
          production_dominant = ", ".join(f"{color} {total}px" for color, total in production_summary["dominant"])
          rows.append(
              f"<tr><td>{screen}</td><td>production screenshot</td><td>{production_summary['size']}</td>"
              f"<td>{production_dominant}</td><td>{production_summary['non_bg_bbox']}</td>"
              f"<td>Playwright harness screenshot</td></tr>"
          )
    return "\n".join(rows)


def write_html() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    measurements = f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>온보딩 픽셀 정렬 측정</title>
  <style>
    body {{ font-family: sans-serif; margin: 24px; color: #1a1a1a; }}
    table {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }}
    th {{ background: #fff1d1; }}
  </style>
</head>
<body>
  <h1>온보딩 03/04/05 픽셀 정렬 측정</h1>
  <p>이 문서는 구현 시점에 PIL로 reference PNG를 다시 읽어 생성했다. 구현 좌표는 <code>src/screens/onboarding/OnboardingScreen.tsx</code>의 absolute 좌표 기준이다.</p>
  <table>
    <thead><tr><th>화면</th><th>항목</th><th>크기/좌표</th><th>dominant color</th><th>non-bg bbox</th><th>비고</th></tr></thead>
    <tbody>{render_measurements()}</tbody>
  </table>
</body>
</html>
"""
    notes = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>온보딩 정렬 메모</title>
  <style>
    body { font-family: sans-serif; margin: 24px; line-height: 1.6; color: #1a1a1a; }
    code { background: #fff1d1; padding: 2px 4px; }
  </style>
</head>
<body>
  <h1>온보딩 03/04/05 구현 메모</h1>
  <ul>
    <li>기본 화면의 <code>다음</code>은 기존 basic completion 조건과 처리 중 상태를 그대로 사용해 비활성화한다.</li>
    <li>닉네임 중복 확인 requirement는 우회하지 않았다. <code>duplicateCheck.state === 'available'</code> 전에는 관심사 화면으로 진행하지 않는다.</li>
    <li>중복/검증 메시지는 기존 <code>nicknameError ?? duplicateMessage</code> 소스를 유지한다. 현재 screen props만으로 generic nickname validation과 duplicate-check visual intent를 완전히 분리할 수 없으므로, 새 contract/container semantics는 만들지 않았다.</li>
    <li>관심사 완료는 <code>props.onSubmit</code>만 호출한다. 기본 화면에는 최종 제출 경로가 없다.</li>
    <li>도메인 값 <code>워라밸</code>은 유지하고, 화면 표시 문자열만 reference PNG에 맞춰 <code>워라벨</code>로 렌더링했다.</li>
    <li>PNG-measured coordinate alignment prepared for manual visual review</li>
  </ul>
</body>
</html>
"""
    (OUT / "measurements.html").write_text(measurements, encoding="utf-8")
    (OUT / "notes.html").write_text(notes, encoding="utf-8")


if __name__ == "__main__":
    write_html()
