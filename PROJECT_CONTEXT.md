# PROJECT_CONTEXT.md

이 문서는 웹 GPT 세션에 현재 로컬 프로젝트를 설명하기 위한 공유용 컨텍스트입니다.
웹 GPT는 로컬 파일시스템을 직접 볼 수 없으므로, 먼저 이 문서를 붙여넣고 필요한 경우 아래의 핵심 파일 내용을 추가로 제공하세요.

## 프로젝트 한줄 요약

범석과 세연의 자산을 각각 입력하고 합산하여 관리하는 개인용 자산 포트폴리오 관리 앱입니다.

## 웹 GPT에게 먼저 전달할 지시

```text
아래 프로젝트 컨텍스트를 먼저 읽고, 이 프로젝트의 목적, 기술 스택, 데이터 구조, 계산 규칙, 변경 금지 사항을 이해해 주세요.

중요:
- 기존 UI/UX, Tailwind 스타일, 레이아웃, 탭 구조, 기능은 임의로 변경하지 않습니다.
- LocalStorage 저장 구조와 기존 저장 데이터 호환성을 유지해야 합니다.
- 자산 카테고리, 목표 비중, 리밸런싱 계산 방식, 가격 fallback 동작을 임의로 바꾸지 않습니다.
- 사용자가 요청하지 않은 리팩터링, 의존성 교체, 아키텍처 변경, 기능 추가를 하지 않습니다.
- 답변이나 제안은 현재 코드 구조를 존중하고 최소 변경을 기준으로 해 주세요.
```

## 현재 저장소 상태

- GitHub repository: `https://github.com/sbspace/portfolio.git`
- 기본 branch: `main`
- 핵심 프로젝트 지침: `AGENTS.md`
- 이전 Claude Code 지침 파일 `CLAUDE.MD`는 Codex 전환 과정에서 `AGENTS.md`로 이전 후 삭제되었습니다.

## 기술 스택

`package.json` 기준 실제 기술 스택입니다.

- React 18
- TypeScript
- Vite 5
- Tailwind CSS 3
- PostCSS + Autoprefixer
- Recharts
- LocalStorage
- html2canvas
- lucide-react
- uuid
- 가격 조회 provider: mock provider / real provider
- real provider 외부 가격 소스: Yahoo Finance, Upbit
- path alias: `@/*` -> `src/*`

## npm scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

- `npm run build`는 TypeScript 검사와 Vite production build를 함께 수행합니다.
- 현재 별도 `lint` 또는 `test` script는 없습니다.
- Windows PowerShell에서 `npm.ps1` 실행 정책 문제가 있으면 `npm.cmd run build`처럼 `npm.cmd`를 사용합니다.

## 프로젝트 구조

```text
.gitignore
AGENTS.md
PROJECT_CONTEXT.md
index.html
package-lock.json
package.json
postcss.config.js
src/App.tsx
src/components/dashboard/CategorySummaryTable.tsx
src/components/dashboard/PortfolioPieChart.tsx
src/components/dashboard/PriceStatusBar.tsx
src/components/layout/Layout.tsx
src/components/layout/Navigation.tsx
src/components/ui/Badge.tsx
src/components/ui/Button.tsx
src/components/ui/EmptyState.tsx
src/components/ui/PageHeader.tsx
src/components/ui/SectionCard.tsx
src/components/ui/index.ts
src/data/defaults.ts
src/hooks/useHistoryFolder.ts
src/hooks/usePortfolio.ts
src/hooks/usePrices.ts
src/index.css
src/main.tsx
src/pages/AssetInputPage.tsx
src/pages/DashboardPage.tsx
src/pages/HistoryPage.tsx
src/pages/RebalancingPage.tsx
src/pages/SettingsPage.tsx
src/pages/TargetWeightPage.tsx
src/services/priceProvider/cache.ts
src/services/priceProvider/index.ts
src/services/priceProvider/mockProvider.ts
src/services/priceProvider/realProvider.ts
src/services/priceProvider/upbit.ts
src/services/priceProvider/yahoo.ts
src/services/storage.ts
src/types/index.ts
src/utils/exportFiles.ts
src/utils/formatting.ts
src/utils/portfolio.ts
src/utils/rebalancing.ts
tailwind.config.js
tsconfig.json
tsconfig.node.json
vite.config.ts
```

## 주요 코드 위치

- `src/types/index.ts`: 도메인 타입, 저장 데이터 모델, 가격 provider 인터페이스
- `src/data/defaults.ts`: 기본 종목, 기본 목표 비중, 기본 설정, 초기 앱 상태
- `src/services/storage.ts`: LocalStorage 저장/로드
- `src/hooks/usePortfolio.ts`: 앱 상태 관리와 포트폴리오 계산 연결
- `src/hooks/usePrices.ts`: 가격 조회 상태 관리
- `src/utils/portfolio.ts`: 자산 평가액과 포트폴리오 합산 계산
- `src/utils/rebalancing.ts`: 목표 비중 검증과 리밸런싱 계산
- `src/pages/*`: 각 탭 화면
- `src/components/*`: 재사용 UI와 대시보드 컴포넌트
- `src/services/priceProvider/*`: mock/real 가격 provider, Yahoo, Upbit, cache

## 화면/탭 구조

현재 앱은 다음 6개 화면 구조를 유지합니다.

1. 대시보드: 총자산, 카테고리별 금액/비중, 파이차트, 목표 대비 차이 요약
2. 자산 입력: 사용자 선택과 현금, 주식, 금, 가상화폐, 고정자산 입력
3. 목표 비중 설정: 최상위 및 종목별 목표 비중과 합계 검증
4. 리밸런싱: 현재/목표 비중과 초과/부족 금액 표
5. 이력: 스냅샷 목록과 자산 추이 차트
6. 설정: 종목 관리, 고정자산 포함 설정, 가격 provider 설정

## 핵심 도메인 타입 요약

- `Owner`: `beomseok` 또는 `seyeon`
- `ViewFilter`: `beomseok`, `seyeon`, `combined`
- `AssetCategory`: `cash`, `stock`, `gold`, `crypto`, `fixedAsset`
- `StockMarket`: `domestic`, `us`
- `Page`: `dashboard`, `input`, `target`, `rebalancing`, `history`, `settings`
- `PriceProviderType`: `mock`, `real`
- `PriceSource`: `mock`, `realtime`, `cached`, `fallback`

주요 상태 구조:

- `AppState`
  - `beomseokAssets`
  - `seyeonAssets`
  - `targetWeights`
  - `snapshots`
  - `settings`
- `PersonAssets`
  - `owner`
  - `cash`
  - `stocks`
  - `gold`
  - `crypto`
  - `fixedAsset`
- `PortfolioCalculation`
  - `totalKrw`
  - `totalKrwWithFixed`
  - `categoryValues`
  - `categoryWeights`
  - `stockHoldings`
  - `cryptoHoldings`
  - `goldValueKrw`
  - `cashLiquidKrw`
  - `cashIlliquidKrw`
  - `fixedDepositKrw`
  - `fixedPensionKrw`
  - fixed asset 포함 여부 flags

## 자산 소유자와 보기

- 자산 소유자는 `beomseok`(범석), `seyeon`(세연) 두 명입니다.
- 두 사람의 입력값은 각각 보존합니다.
- 기본 대시보드는 합산 기준입니다.
- 화면에서 범석, 세연, 합산 보기를 선택할 수 있습니다.

## 자산 카테고리

최상위 자산 카테고리는 반드시 다음 5개를 유지합니다.

1. 현금: `cash`
2. 주식: `stock`
3. 금: `gold`
4. 가상화폐: `crypto`
5. 고정자산: `fixedAsset`

## 현금 규칙

- 유동 현금: 은행 계좌, 증권계좌 예수금 등 투자에 사용할 수 있는 돈
- 비유동 현금: 청약통장, 청년도약계좌 등 유동성이 낮은 돈
- 사용자는 만원 단위로 입력합니다.
- 내부 계산은 원 단위로 변환합니다.
- 예: 입력값 `2000`은 2,000만원입니다.

## 주식 규칙

- 국내주식과 미국주식으로 구분합니다.
- 종목별 보유 수량을 입력합니다.
- 국내주식 평가액: `보유 수량 x 현재가(KRW)`
- 미국주식 평가액: `보유 수량 x 현재가(USD) x USD/KRW 환율`
- 종목 추가, 삭제, 수정 기능을 유지합니다.

기본 국내 종목:

- SK하이닉스: `000660`, Yahoo `000660.KS`
- 미코: `059090`, Yahoo `059090.KQ`
- 삼성전자: `005930`, Yahoo `005930.KS`
- 파두: `440110`, Yahoo `440110.KQ`

기본 미국 종목:

- `TSLA`
- `SPCX`
- `RKLB`
- `QLD`
- `MRVL`
- `IREN`
- `INTC`
- `INFQ`
- `CRCL`
- `CBRS`

## 금 규칙

- 별도 하위 카테고리는 없습니다.
- KRX 금현물 기준으로 관리합니다.
- 보유량은 g 단위로 입력합니다.
- 평가액: `보유 g x g당 원화 가격`
- 현재 real provider는 국제 금 선물 가격과 USD/KRW 환율을 이용해 g당 원화 가격으로 환산합니다.
- 조회 실패 시 수동 설정 가격을 fallback으로 사용합니다.

## 가상화폐 규칙

- Upbit의 원화 가격을 기준으로 관리합니다.
- 종목별 보유 수량을 입력합니다.
- 소수 수량을 지원합니다.
- 평가액: `보유 수량 x 현재 원화 가격`
- 종목 추가, 삭제, 수정 기능을 유지합니다.

기본 종목:

- `BTC`
- `ETH`
- `SOL`
- `DOGE`

## 고정자산 규칙

- 전세자금과 개인연금으로 구분합니다.
- 사용자는 만원 단위로 입력합니다.
- 범석과 세연 각각에 대해 전세자금과 개인연금의 포트폴리오 포함 여부를 선택할 수 있습니다.
- 선택된 고정자산만 목표 비중과 포트폴리오 총액 계산에 포함합니다.
- 전체 고정자산을 포함한 총액도 기존 계산 방식대로 유지합니다.

## 기본 목표 비중

`src/data/defaults.ts` 기준:

```ts
{
  cash: 20,
  stock: 50,
  gold: 10,
  crypto: 20,
  fixedAsset: 0,
  stockHoldings: {},
  cryptoHoldings: {},
}
```

## 목표 비중 규칙

- 최상위 5개 카테고리별 목표 비중을 설정합니다.
- 고정자산은 포함 설정에 따라 목표 비중 계산 대상에 포함하거나 제외합니다.
- 하위 목표 비중은 주식 종목과 가상화폐 종목에 대해서만 설정합니다.
- 종목의 최종 포트폴리오 목표 비중은 `상위 카테고리 목표 비중 x 해당 카테고리 내 종목 목표 비중`입니다.
- 최상위 목표 비중 합계는 100%인지 검증합니다.
- 주식 내 종목별 목표 비중 합계와 가상화폐 내 종목별 목표 비중 합계도 각각 100%인지 검증합니다.
- 합계가 100%가 아니면 사용자에게 경고합니다.

예: 주식 목표 50%, 삼성전자 주식 내 목표 20%이면 삼성전자의 전체 포트폴리오 목표 비중은 10%입니다.

## 리밸런싱 규칙

상위 카테고리와 주식/가상화폐 종목별로 다음 값을 제공합니다.

- 현재 평가액
- 현재 비중
- 목표 비중
- 비중 차이
- 목표 금액
- 금액 차이

계산식:

- 비중 차이: `현재 비중 - 목표 비중`
- 목표 금액: `포트폴리오 총액 x 목표 비중`
- 금액 차이: `현재 평가액 - 목표 금액`
- 금액 차이가 양수이면 초과 보유, 음수이면 추가 매수 필요로 해석합니다.

중요: `src/utils/rebalancing.ts`의 부호와 계산 방향을 임의로 반전하지 마세요.

## 가격 조회와 실패 처리

- 가격 조회는 `PriceProvider` 인터페이스 뒤에 유지하여 UI와 분리합니다.
- 설정에 따라 mock 또는 real provider를 사용합니다.
- real provider는 Yahoo Finance에서 환율, 주식, 금 가격을 조회합니다.
- real provider는 Upbit에서 가상화폐 가격을 조회합니다.
- 가격 캐시는 현재 구현의 TTL과 마지막 값 사용 방식을 유지합니다.
- 조회 실패가 전체 포트폴리오 계산을 중단시키지 않도록 마지막 캐시 가격, 수동 입력 가격 또는 기존 fallback 값을 사용합니다.
- 오류 상태는 UI에 표시합니다.
- 가격 API나 provider 구조를 변경할 때는 기존 통화 단위와 fallback 동작을 먼저 확인해야 합니다.

## 스냅샷과 이력

스냅샷 저장 시점에 다음 정보를 보존합니다.

- 저장 날짜와 시간
- 범석/세연별 입력값
- 가격 정보
- 계산된 평가액과 총자산
- 카테고리별 평가액
- 당시 목표 비중 설정값

저장된 스냅샷으로 총자산 및 카테고리별 추이 차트를 구성합니다.
기존 스냅샷을 읽지 못하게 하는 저장 형식 변경은 금지합니다.
형식 변경이 명시적으로 요청된 경우 반드시 migration과 backward compatibility를 함께 설계해야 합니다.

## 변경 금지 및 주의 사항

다음은 명시적인 요청 없이는 변경하지 않습니다.

- 기존 화면 디자인
- 레이아웃
- 색상
- Tailwind 스타일
- 컴포넌트 디자인
- 화면 구성
- 사용자 interaction
- 현재 제공되는 기능
- 계산 로직
- LocalStorage 데이터 구조
- 기존 저장 데이터와의 호환성
- 자산 카테고리 구조
- 목표 비중 계산 방식
- 리밸런싱 계산 방식
- 차트 동작
- 라우팅/탭 구조
- 기본 종목 및 자산 설정
- dependency
- architecture

## 웹 GPT에 추가로 제공하면 좋은 파일

전체 프로젝트를 한 번에 붙여넣기보다, 질문 주제에 따라 아래 파일만 추가로 제공하는 것을 권장합니다.

### 저장 구조나 데이터 모델 논의

- `src/types/index.ts`
- `src/services/storage.ts`
- `src/data/defaults.ts`
- `src/hooks/usePortfolio.ts`

### 계산 로직 논의

- `src/types/index.ts`
- `src/data/defaults.ts`
- `src/utils/portfolio.ts`
- `src/utils/rebalancing.ts`

### 가격 조회 논의

- `src/types/index.ts`
- `src/hooks/usePrices.ts`
- `src/services/priceProvider/index.ts`
- `src/services/priceProvider/mockProvider.ts`
- `src/services/priceProvider/realProvider.ts`
- `src/services/priceProvider/cache.ts`
- `src/services/priceProvider/yahoo.ts`
- `src/services/priceProvider/upbit.ts`

### UI나 화면 동작 논의

- `src/App.tsx`
- `src/components/layout/Layout.tsx`
- `src/components/layout/Navigation.tsx`
- 관련 `src/pages/*.tsx`
- 관련 `src/components/**/*.tsx`
- `src/index.css`
- `tailwind.config.js`

## 웹 GPT에 파일 내용을 추가할 때 추천 프롬프트

```text
이제 아래 파일 내용을 추가로 제공합니다.
먼저 기존 동작과 데이터 흐름을 설명하고, 변경이 필요하다면 최소 수정 범위를 제안해 주세요.
사용자 요청 없이 UI/디자인/데이터 구조/계산 방식을 바꾸지 마세요.

파일: src/utils/rebalancing.ts

[여기에 파일 내용 붙여넣기]
```

## Codex에서 작업할 때의 기본 순서

1. 관련 코드, 타입, 데이터 흐름을 탐색합니다.
2. 기존 동작과 저장 호환성, 영향을 받는 화면을 파악합니다.
3. 변경 범위를 필요한 파일과 동작으로 최소화합니다.
4. 기존 패턴과 스타일에 맞춰 구현합니다.
5. 프로젝트에 실제 존재하는 typecheck, build, test, lint 명령만 수행합니다.
6. diff를 검토하여 관련 없는 UI, CSS, 계산, 데이터 모델, 의존성 변경이 없는지 확인합니다.
7. 변경사항, 검증 결과, 남은 regression 가능성을 요약합니다.

## 현재 Git ignore 정책

Git에 포함하지 않는 주요 항목:

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`
- 로그 파일
- OS/IDE 임시 파일
- Vite/TypeScript build cache

Git에 포함해야 하는 주요 항목:

- `src/`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig*`
- `tailwind.config.js`
- `postcss.config.js`
- `index.html`
- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- README/docs가 생기면 해당 문서
