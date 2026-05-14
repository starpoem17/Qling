import test from 'node:test';
import assert from 'node:assert/strict';
import { getPrdAnswerFeed } from './serverAnswerFeed';

type Store = Record<string, Record<string, unknown>>;

function createDoc(id: string, data: Record<string, unknown> | undefined) {
  return {
    id,
    exists: data !== undefined,
    data: () => data,
  };
}

function createDb(store: Store) {
  function collection(path: string) {
    return {
      where(field: string, op: string, value: unknown) {
        const filters = [[field, op, value]];
        return {
          where(nextField: string, nextOp: string, nextValue: unknown) {
            filters.push([nextField, nextOp, nextValue]);
            return this;
          },
          async get() {
            const prefix = `${path}/`;
            const docs = Object.entries(store)
              .filter(([docPath]) => docPath.startsWith(prefix) && !docPath.slice(prefix.length).includes('/'))
              .filter(([, data]) => filters.every(([filterField, filterOp, filterValue]) => (
                filterOp === '==' && data[String(filterField)] === filterValue
              )))
              .map(([docPath, data]) => createDoc(docPath.slice(prefix.length), data));
            return { docs };
          },
        };
      },
      doc(id: string) {
        return {
          async get() {
            return createDoc(id, store[`${path}/${id}`]);
          },
          collection(child: string) {
            return collection(`${path}/${id}/${child}`);
          },
        };
      },
      async get() {
        const prefix = `${path}/`;
        return {
          docs: Object.entries(store)
            .filter(([docPath]) => docPath.startsWith(prefix) && !docPath.slice(prefix.length).includes('/'))
            .map(([docPath, data]) => createDoc(docPath.slice(prefix.length), data)),
        };
      },
    };
  }

  return { collection };
}

function visibleStore(overrides: Store = {}): Store {
  return {
    'users/recipient': {},
    'deliveries/delivery1': {
      worryId: 'worry1',
      authorUid: 'author',
      recipientUid: 'recipient',
      status: 'active',
    },
    'worries/worry1': {
      content: 'visible content',
      matchingCategories: ['진로'],
      createdAt: { toMillis: () => 1 },
    },
    ...overrides,
  };
}

test('server answer feed includes active visible delivery joined to visible worry', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore()) as never,
    uid: 'recipient',
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].deliveryId, 'delivery1');
  assert.equal(items[0].worryId, 'worry1');
  assert.equal(items[0].originalContent, 'visible content');
  assert.deepEqual(items[0].categories, ['진로']);
  assert.equal(items[0].hasUnread, true);
});

test('server answer feed preserves read-state behavior', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'users/recipient/deliveryReadStates/delivery1': { readAt: 'now' },
    })) as never,
    uid: 'recipient',
  });

  assert.equal(items[0].hasUnread, false);
});

test('server answer feed excludes answered deliveries', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/delivery1': {
        worryId: 'worry1',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'active',
        answeredAt: 'now',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.deepEqual(items, []);
});

test('server answer feed excludes passed deliveries', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/delivery1': {
        worryId: 'worry1',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'active',
        passedAt: 'now',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.deepEqual(items, []);
});

test('server answer feed excludes hidden delivery', async () => {
  const hiddenAt = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/delivery1': {
        worryId: 'worry1',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'active',
        hiddenAt: 'now',
      },
    })) as never,
    uid: 'recipient',
  });
  const hiddenStatus = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/delivery1': {
        worryId: 'worry1',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'hidden',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.deepEqual(hiddenAt, []);
  assert.deepEqual(hiddenStatus, []);
});

test('server answer feed excludes delivery whose worry is hidden', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'worries/worry1': {
        content: 'hidden content',
        status: 'hidden',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.deepEqual(items, []);
});

test('server answer feed excludes delivery whose worry is missing', async () => {
  const store = visibleStore();
  delete store['worries/worry1'];

  const items = await getPrdAnswerFeed({
    db: createDb(store) as never,
    uid: 'recipient',
  });

  assert.deepEqual(items, []);
});

test('server answer feed excludes delivery for another recipient', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/delivery1': {
        worryId: 'worry1',
        authorUid: 'author',
        recipientUid: 'other',
        status: 'active',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.deepEqual(items, []);
});

test('server answer feed does not expose hidden or deleted worry content', async () => {
  const items = await getPrdAnswerFeed({
    db: createDb(visibleStore({
      'deliveries/hidden': {
        worryId: 'hiddenWorry',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'active',
      },
      'deliveries/deleted': {
        worryId: 'deletedWorry',
        authorUid: 'author',
        recipientUid: 'recipient',
        status: 'active',
      },
      'worries/hiddenWorry': {
        content: 'hidden secret',
        hiddenAt: 'now',
      },
      'worries/deletedWorry': {
        content: 'deleted secret',
        status: 'deleted',
      },
    })) as never,
    uid: 'recipient',
  });

  assert.equal(items.some(item => item.originalContent.includes('secret')), false);
});
