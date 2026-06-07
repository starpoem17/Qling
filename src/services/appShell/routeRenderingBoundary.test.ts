import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  REQUIRED_ROUTE_RENDERING_GROUPS,
  ROUTE_RENDERING_BOUNDARY,
  isRouteInGroup,
  routeRenderingBoundaryForRoute,
  routeRenderingGroupForRoute,
} from './routeRenderingBoundary';

test('covers every Phase 3 required route rendering group', () => {
  assert.deepEqual(REQUIRED_ROUTE_RENDERING_GROUPS, [
    'authenticated shell',
    'onboarding flow',
    'received worries',
    'write worry',
    'write reply',
    'answer check',
    'reply details',
    'my-page/account',
    'policy screens',
  ]);

  for (const group of REQUIRED_ROUTE_RENDERING_GROUPS) {
    assert.ok(ROUTE_RENDERING_BOUNDARY[group].routes.length > 0, `${group} needs route coverage`);
    assert.ok(ROUTE_RENDERING_BOUNDARY[group].appBoundary.length > 0, `${group} needs App boundary notes`);
    assert.ok(ROUTE_RENDERING_BOUNDARY[group].nextContainerBoundary.length > 0, `${group} needs next-container notes`);
  }
});

test('maps canonical route states to their Phase 3 route rendering boundaries', () => {
  assert.equal(routeRenderingGroupForRoute('tutorial'), 'onboarding flow');
  assert.equal(routeRenderingGroupForRoute('onboarding'), 'onboarding flow');
  assert.equal(routeRenderingGroupForRoute('onboarding_duplicate_check'), 'onboarding flow');
  assert.equal(routeRenderingGroupForRoute('답변하기'), 'received worries');
  assert.equal(routeRenderingGroupForRoute('received_worries'), 'received worries');
  assert.equal(routeRenderingGroupForRoute('채팅'), 'authenticated shell');
  assert.equal(routeRenderingGroupForRoute('순위'), 'authenticated shell');
  assert.equal(routeRenderingGroupForRoute('write_worry'), 'write worry');
  assert.equal(routeRenderingGroupForRoute('write_worry_success'), 'write worry');
  assert.equal(routeRenderingGroupForRoute('write_reply'), 'write reply');
  assert.equal(routeRenderingGroupForRoute('write_reply_success'), 'write reply');
  assert.equal(routeRenderingGroupForRoute('나의 고민'), 'authenticated shell');
  assert.equal(routeRenderingGroupForRoute('answer_check'), 'answer check');
  assert.equal(routeRenderingGroupForRoute('received_answer_detail'), 'reply details');
  assert.equal(routeRenderingGroupForRoute('my_answer_detail'), 'reply details');
  assert.equal(routeRenderingGroupForRoute('my_worry_detail'), 'reply details');
  assert.equal(routeRenderingGroupForRoute('마이페이지'), 'my-page/account');
  assert.equal(routeRenderingGroupForRoute('my_answers'), 'my-page/account');
  assert.equal(routeRenderingGroupForRoute('account_deletion_confirmation'), 'my-page/account');
  assert.equal(routeRenderingGroupForRoute('privacy_policy'), 'policy screens');
});

test('keeps excluded MVP routes out of route rendering boundary groups', () => {
  const allBoundaryRoutes = Object.values(ROUTE_RENDERING_BOUNDARY).flatMap(group => group.routes);

  for (const excluded of [
    'operation_policy',
    'app_install_guide',
    'notification_settings',
    'read_my_reply',
  ]) {
    assert.equal((allBoundaryRoutes as readonly string[]).includes(excluded), false);
  }
  assert.equal((allBoundaryRoutes as readonly string[]).includes('privacy_policy'), true);
});

test('identifies authenticated shell membership separately from route-specific groups', () => {
  assert.equal(isRouteInGroup('write_reply', 'authenticated shell'), true);
  assert.equal(isRouteInGroup('privacy_policy', 'authenticated shell'), true);
  assert.equal(isRouteInGroup('onboarding', 'authenticated shell'), false);
  assert.equal(isRouteInGroup('login', 'authenticated shell'), false);

  assert.deepEqual(routeRenderingBoundaryForRoute({ route: 'write_reply', deliveryId: 'delivery-1', worryId: 'worry-1' }), {
    currentRoute: 'write_reply',
    routeGroup: 'write reply',
    authenticatedTab: '답변하기',
    mountsAuthenticatedShell: true,
    mountsBottomNavigation: true,
    mainScrollMode: 'document',
  });
  assert.deepEqual(routeRenderingBoundaryForRoute({ route: 'answer_check', worryId: 'worry-1' }), {
    currentRoute: 'answer_check',
    routeGroup: 'answer check',
    authenticatedTab: '나의 고민',
    mountsAuthenticatedShell: true,
    mountsBottomNavigation: true,
    mainScrollMode: 'document',
  });
  assert.deepEqual(routeRenderingBoundaryForRoute('edit_interests'), {
    currentRoute: 'edit_interests',
    routeGroup: 'my-page/account',
    authenticatedTab: null,
    mountsAuthenticatedShell: true,
    mountsBottomNavigation: false,
    mainScrollMode: 'route',
  });
  assert.deepEqual(routeRenderingBoundaryForRoute('순위'), {
    currentRoute: '순위',
    routeGroup: 'authenticated shell',
    authenticatedTab: '순위',
    mountsAuthenticatedShell: true,
    mountsBottomNavigation: true,
    mainScrollMode: 'document',
  });
  assert.deepEqual(routeRenderingBoundaryForRoute('onboarding_interests'), {
    currentRoute: 'onboarding_interests',
    routeGroup: 'onboarding flow',
    authenticatedTab: null,
    mountsAuthenticatedShell: false,
    mountsBottomNavigation: false,
    mainScrollMode: 'route',
  });
  assert.deepEqual(routeRenderingBoundaryForRoute('tutorial'), {
    currentRoute: 'tutorial',
    routeGroup: 'onboarding flow',
    authenticatedTab: null,
    mountsAuthenticatedShell: false,
    mountsBottomNavigation: false,
    mainScrollMode: 'route',
  });
});

test('keeps document scrolling as route rendering policy so flex bottom navigation stays visible', () => {
  assert.equal(routeRenderingBoundaryForRoute('received_worries').mainScrollMode, 'document');
  assert.equal(routeRenderingBoundaryForRoute('my_worries').mainScrollMode, 'document');
  assert.equal(routeRenderingBoundaryForRoute('ranking').mainScrollMode, 'document');
  assert.equal(routeRenderingBoundaryForRoute('edit_interests').mainScrollMode, 'route');
  assert.equal(routeRenderingBoundaryForRoute('login').mainScrollMode, 'route');
  assert.equal(routeRenderingBoundaryForRoute('onboarding').mainScrollMode, 'route');
});

test('locks App main scrolling for fixed-canvas routes', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');

  assert.match(source, /routeBoundary\.mainScrollMode === 'document' && 'overflow-y-auto'/);
  assert.match(source, /currentRoute === 'answer_check' \|\| currentRoute === '순위' \|\| currentRoute === 'ranking' \|\| currentRoute === 'privacy_policy' \|\| currentRoute === '마이페이지' \|\| currentRoute === 'my_page' \|\| currentRoute === 'my_answers' \|\| currentRoute === 'edit_interests'[\s\S]*\? 'overflow-hidden'/);
  assert.match(source, /currentRoute === 'edit_interests' \? 'pt-0 pb-0' : undefined/);
  assert.match(source, /initial=\{\{ opacity: 0, y: currentRoute === 'edit_interests' \? 0 : 20 \}\}/);
  assert.ok(
    source.indexOf("routeBoundary.mainScrollMode === 'document' && 'overflow-y-auto'")
      < source.indexOf("currentRoute === 'answer_check' || currentRoute === '순위' || currentRoute === 'ranking' || currentRoute === 'privacy_policy' || currentRoute === '마이페이지' || currentRoute === 'my_page' || currentRoute === 'my_answers' || currentRoute === 'edit_interests'"),
  );
});

test('chat room route wrapper avoids vertical motion during keyboard-sensitive layout', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');
  const chatRoomStart = source.indexOf('key="chat_room"');
  const chatRoomBranch = source.slice(chatRoomStart, source.indexOf("currentRoute === 'report_user'", chatRoomStart));

  assert.match(chatRoomBranch, /key="chat_room" initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\} exit=\{\{ opacity: 0 \}\} className="h-full"/);
  assert.doesNotMatch(chatRoomBranch, /[,{]\s*y:\s*-?\d+/);
  assert.match(source, /currentRoute === 'chat_room' \? 'px-0 pb-0 pt-0 bg-\[#fff1d1\]' : undefined/);
});

test('keeps standalone PWA route chrome split between top status bar and bottom outside area', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');

  assert.match(source, /pwaRouteChromeForRoute\(currentRoute\)/);
  assert.match(source, /document\.documentElement\.classList\.contains\('qling-ios-standalone-pwa'\)/);
  assert.match(source, /themeMeta\?\.setAttribute\('content', standalonePwaRouteChrome\.top\)/);
  assert.match(source, /document\.documentElement\.style\.backgroundColor = standalonePwaRouteChrome\.bottom/);
  assert.match(source, /document\.body\.style\.backgroundColor = standalonePwaRouteChrome\.bottom/);
  assert.match(source, /route === 'write_worry' \|\| route === 'write_reply' \|\| route === 'answer_check'/);
  assert.match(source, /route === 'privacy_policy'/);
  assert.match(source, /route === 'edit_interests'[\s\S]*return \{ top: '#ff8b3d', bottom: '#fff7e3' \}/);
  assert.match(source, /route === '마이페이지' \|\| route === 'my_page' \|\| route === 'my_answers'/);
});

test('detects iOS Safari browser and standalone PWA mode before app boot', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const cssSource = fs.readFileSync('src/index.css', 'utf8');

  assert.match(indexHtml, /const isIos = \/iPad\|iPhone\|iPod\/\.test\(ua\)/);
  assert.match(indexHtml, /const isSafari = \/Safari\/\.test\(ua\) && !\/CriOS\|FxiOS\|EdgiOS\|OPiOS\/\.test\(ua\)/);
  assert.match(indexHtml, /window\.matchMedia\('\(display-mode: standalone\)'\)\.matches \|\| Boolean\(navigator\.standalone\)/);
  assert.match(indexHtml, /document\.documentElement\.classList\.add\('qling-ios-safari-browser'\)/);
  assert.match(indexHtml, /document\.documentElement\.classList\.add\('qling-ios-standalone-pwa'\)/);
  assert.match(indexHtml, /document\.querySelector\('meta\[name="theme-color"\]'\)\?\.setAttribute\('content', '#fff5eb'\)/);
  assert.match(indexHtml, /<meta name="theme-color" content="#ff8b3d" \/>/);
  assert.match(cssSource, /html,\s*body,\s*#root[\s\S]*background: #ff8b3d;/);
  assert.match(cssSource, /html\.qling-ios-standalone-pwa[\s\S]*--qling-space-nav-base-height: 65px;/);
  assert.match(cssSource, /html\.qling-ios-standalone-pwa[\s\S]*--qling-space-nav-height: var\(--qling-space-nav-base-height\);/);
  assert.match(cssSource, /html\.qling-ios-safari-browser[\s\S]*--qling-space-safe-top: max\(env\(safe-area-inset-top, 0px\), 47px\);/);
  assert.match(cssSource, /html\.qling-ios-safari-browser[\s\S]*--qling-space-nav-base-height: 65px;/);
  assert.match(cssSource, /html\.qling-ios-safari-browser[\s\S]*--qling-space-nav-height: var\(--qling-space-nav-base-height\);/);
  assert.match(cssSource, /html\.qling-ios-safari-browser \.qling-production-main--with-bottom-nav[\s\S]*padding-top: 0;/);
});

test('bottom navigation shell routes remove default top padding', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');

  assert.match(source, /routeBoundary\.mountsBottomNavigation \? 'pt-0' : 'pt-6'/);
});

test('onboarding flow removes App shell padding for responsive canvas routes', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');

  assert.match(source, /routeBoundary\.routeGroup === 'onboarding flow'[\s\S]*\? 'px-0 pt-0 pb-0 overflow-hidden bg-\[#ff8b0d\]'/);
  assert.doesNotMatch(source, /routeBoundary\.routeGroup === 'onboarding flow'[\s\S]*\? ["']pt-12["']/);
  assert.match(source, /key="onboarding"[\s\S]*className="h-full"/);
});

test('keeps every bottom-navigation route on the content scroll policy', () => {
  for (const route of [
    'received_worries',
    'my_worries',
    'chat',
    'ranking',
    'write_worry',
    'write_reply_success',
    'answer_check',
    'privacy_policy',
    'account_deletion_confirmation',
  ] as const) {
    const boundary = routeRenderingBoundaryForRoute(route);

    assert.equal(boundary.mountsBottomNavigation, true);
    assert.equal(boundary.mainScrollMode, 'document');
  }

  assert.equal(routeRenderingBoundaryForRoute('edit_interests').mountsBottomNavigation, false);
  assert.equal(routeRenderingBoundaryForRoute('edit_interests').mainScrollMode, 'route');
  assert.equal(routeRenderingBoundaryForRoute({ route: 'chat_room', chatId: 'chat-1' }).mountsBottomNavigation, false);
  assert.equal(routeRenderingBoundaryForRoute({ route: 'chat_room', chatId: 'chat-1' }).mainScrollMode, 'route');
});

test('keeps route rendering policy outside App.tsx branch helpers', () => {
  const source = fs.readFileSync('src/App.tsx', 'utf8');

  assert.match(source, /routeRenderingBoundaryForRoute/);
  assert.doesNotMatch(source, /function routeRenderingGroupForRoute/);
  assert.doesNotMatch(source, /const routeRenderingGroupForRoute/);
  assert.doesNotMatch(source, /usage_guide/);
  assert.doesNotMatch(source, /generic policy/);
});

test('records visual reskin non-start evidence for copied static design markers', () => {
  const checkedSources = [
    fs.readFileSync('src/App.tsx', 'utf8'),
    fs.readFileSync('src/services/appShell/routeRenderingBoundary.ts', 'utf8'),
  ].join('\n');

  assert.doesNotMatch(checkedSources, /라미|fake status|status bar|home indicator|Lorem|lorem|sample data/);
  assert.doesNotMatch(checkedSources, /314/);
});
