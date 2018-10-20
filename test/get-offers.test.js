const request = require(`supertest`);
const assert = require(`assert`);
const LocalServer = require(`../src/server/local-server`);
const offers = require(`./../src/server/offers/offers`);
const {OFFERS_SKIP, OFFERS_LIMIT, StatusCodes} = require(`./../src/server/server-settings`);

const localServer = new LocalServer();
localServer.setup();
const app = localServer.app;

describe(`GET /api/offers`, () => {
  it(`get all ${OFFERS_LIMIT} offers and additional propeties`, async () => {
    const response = await request(app)
    .get(`/api/offers`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.OK)
    .expect(`Content-Type`, /json/);

    const requestedData = response.body;

    assert.deepStrictEqual(requestedData, {
      data: offers.slice(0, OFFERS_LIMIT),
      total: OFFERS_LIMIT,
      skip: OFFERS_SKIP,
      limit: OFFERS_LIMIT
    });
  });

  it(`get all offers with / at the end`, async () => {
    const response = await request(app)
    .get(`/api/offers/`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.OK)
    .expect(`Content-Type`, /json/);

    const requestedData = response.body;

    assert.deepStrictEqual(requestedData, {
      data: offers.slice(0, OFFERS_LIMIT),
      total: OFFERS_LIMIT,
      skip: OFFERS_SKIP,
      limit: OFFERS_LIMIT
    });
  });

  it(`get data from unknown resource`, async () => {
    return await request(app)
    .get(`/api/something-unknown`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.NOT_FOUND)
    .expect(`Page was not found`)
    .expect(`Content-Type`, /html/);
  });

  it(`get offers with limit param`, async () => {
    const LIMIT_PARAM = 5;
    const response = await request(app)
    .get(`/api/offers?limit=${LIMIT_PARAM}`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.OK)
    .expect(`Content-Type`, /json/);

    const requestedData = response.body;
    assert.strictEqual(requestedData.data.length, LIMIT_PARAM);
    assert.strictEqual(requestedData.total, LIMIT_PARAM);
    assert.strictEqual(requestedData.data[LIMIT_PARAM - 1].date, offers[LIMIT_PARAM - 1].date);
  });

  it(`get offers with skip param`, async () => {
    const SKIP_PARAM = 7;
    const response = await request(app)
    .get(`/api/offers?skip=${SKIP_PARAM}`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.OK)
    .expect(`Content-Type`, /json/);

    const requestedData = response.body;

    assert.deepStrictEqual(requestedData.data, offers.slice(SKIP_PARAM, SKIP_PARAM + OFFERS_LIMIT));
    assert.strictEqual(requestedData.data.length, OFFERS_LIMIT);
  });
});

describe(`GET /api/offers/:date`, () => {
  it(`get offer with correct date`, async () => {
    const OFFER_INDEX = 0;
    const offer = offers[OFFER_INDEX];

    const response = await request(app)
    .get(`/api/offers/${offer.date}`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.OK)
    .expect(`Content-Type`, /json/);

    const requestedOffer = response.body;

    assert.strictEqual(requestedOffer.date, offer.date);
  });

  it(`get offer with incorrect date`, async () => {
    const NINE_DAYS = 1000 * 60 * 60 * 24 * 9;

    return await request(app)
    .get(`/api/offers/${Date.now() - NINE_DAYS}`)
    .set(`Accept`, `application/json`)
    .expect(StatusCodes.NOT_FOUND)
    .expect(`Content-Type`, /html/);
  });
});