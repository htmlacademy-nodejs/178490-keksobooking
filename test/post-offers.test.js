const request = require(`supertest`);
const assert = require(`assert`);
const express = require(`express`);

const offersStoreMock = require(`./mock/offers-store-mock`);
const MockImageStore = require(`./mock/images-store-mock`);

const {DEFAULT_PATH,
  ImagesStoreNames,
  MAX_ADDRESS_LENGTH,
  NAMES,
  Price,
  RoomsQuantity,
  StatusCodes,
  ValidateErrorMessage} = require(`./../src/server/server-settings`);

const offersRoute = require(`../src/server/routes/router`)(
    offersStoreMock,
    new MockImageStore(ImagesStoreNames.AVATARS),
    new MockImageStore(ImagesStoreNames.PREVIEWS)
);

const VALID_POST_OFFER = {
  name: `Anna`,
  title: `Small flat in the city centre near the Central Park`,
  address: `570, 472`,
  price: 30000,
  type: `flat`,
  rooms: 0,
  guests: 1,
  checkin: `9:00`,
  checkout: `12:00`,
  features: [`elevator`, `conditioner`],
  location: {
    x: 570,
    y: 472
  }
};

const app = express();
app.use(DEFAULT_PATH, offersRoute);
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).send(`Page was not found`);
});

describe(`POST ${DEFAULT_PATH}`, () => {
  describe(`POST valid offer`, () => {
    it(`sends correct offer as json`, async () => {
      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(VALID_POST_OFFER)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.OK)
        .expect(`Content-Type`, /json/);

      assert.deepStrictEqual(response.body, VALID_POST_OFFER);
    });

    it(`sends correct offer as multipart/form-data`, async () => {
      const expectedResponse = {
        name: VALID_POST_OFFER.name,
        title: VALID_POST_OFFER.title,
        type: VALID_POST_OFFER.type,
        price: VALID_POST_OFFER.price.toString(),
        address: VALID_POST_OFFER.address,
        checkin: VALID_POST_OFFER.checkin,
        checkout: VALID_POST_OFFER.checkout,
        rooms: VALID_POST_OFFER.rooms.toString(),
        features: [],
        avatar: {
          name: `user01.png`,
          mimetype: `image/png`
        },
        preview: [{
          name: `user02.png`,
          mimetype: `image/png`
        }],
        location: {
          x: VALID_POST_OFFER.location.x,
          y: VALID_POST_OFFER.location.y
        }
      };
      const response = await request(app)
        .post(DEFAULT_PATH)
        .field(`name`, VALID_POST_OFFER.name)
        .field(`title`, VALID_POST_OFFER.title)
        .field(`type`, VALID_POST_OFFER.type)
        .field(`price`, VALID_POST_OFFER.price)
        .field(`address`, VALID_POST_OFFER.address)
        .field(`checkin`, VALID_POST_OFFER.checkin)
        .field(`checkout`, VALID_POST_OFFER.checkout)
        .field(`rooms`, VALID_POST_OFFER.rooms)
        .attach(`avatar`, `${__dirname}/../static/img/avatars/user01.png`)
        .attach(`preview`, `${__dirname}/../static/img/avatars/user02.png`)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `multipart/form-data`)
        .expect(StatusCodes.OK)
        .expect(`Content-Type`, /json/);

      assert.deepStrictEqual(response.body, expectedResponse);
    });
  });

  describe(`Unvalid title offer`, () => {
    it(`doesn't send offer without title`, async () => {
      const offerWithoutTitle = Object.assign({}, VALID_POST_OFFER, {title: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutTitle)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutTitleErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutTitleErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer if title isn't a string`, async () => {
      const offerWithNotStringTitle = Object.assign({}, VALID_POST_OFFER, {title: 2222});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithNotStringTitle)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidTitleErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidTitleErrMessage, ValidateErrorMessage.TITLE);
    });

    it(`doesn't send offer with short title`, async () => {
      const shortTitleOffer = Object.assign({}, VALID_POST_OFFER, {title: `wrong`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(shortTitleOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const shortTitleErrorMessage = response.body[0].errorMessage;

      assert.strictEqual(shortTitleErrorMessage, ValidateErrorMessage.TITLE);
    });

    it(`doesn't send offer with too long title`, async () => {
      const longTitleOffer = Object.assign({}, VALID_POST_OFFER, {title: `Small flat in the city centre near the Central Park Small flat in the city centre near the Central Park Small flat in the city centre Central Park`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(longTitleOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const shortTitleErrorMessage = response.body[0].errorMessage;

      assert.strictEqual(shortTitleErrorMessage, ValidateErrorMessage.TITLE);
    });
  });

  describe(`Unvalid type offer`, () => {
    it(`doesn't send offer without type`, async () => {
      const offerWithoutType = Object.assign({}, VALID_POST_OFFER, {type: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutType)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutTypeErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutTypeErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with unknown type`, async () => {
      const unknownTypeOffer = Object.assign({}, VALID_POST_OFFER, {type: `room`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(unknownTypeOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unknownTypeErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unknownTypeErrMessage, ValidateErrorMessage.TYPE);
    });
  });

  describe(`Unvalid price offer`, () => {
    it(`doesn't send offer without price`, async () => {
      const offerWithoutPrice = Object.assign({}, VALID_POST_OFFER, {price: void 0});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutPrice)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutPriceErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutPriceErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with price bigger than ${Price.MAX}`, async () => {
      const offerWithBigPrice = Object.assign({}, VALID_POST_OFFER, {price: 200000});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithBigPrice)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const bigPriceErrMessage = response.body[0].errorMessage;

      assert.strictEqual(bigPriceErrMessage, ValidateErrorMessage.PRICE);
    });

    it(`doesn't send offer with not a number price`, async () => {
      const offerWithNaNPrice = Object.assign({}, VALID_POST_OFFER, {price: `i'm thinking about it`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithNaNPrice)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidPriceErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidPriceErrMessage, ValidateErrorMessage.PRICE);
    });
  });

  describe(`Unvalid address offer`, () => {
    it(`doesn't send offer without address`, async () => {
      const offerWithoutAddress = Object.assign({}, VALID_POST_OFFER, {address: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutAddress)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutAddressErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutAddressErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with address length more than ${MAX_ADDRESS_LENGTH} symbols`, async () => {
      const longAddressOffer = Object.assign({}, VALID_POST_OFFER, {address: `1222222222222222222222223eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(longAddressOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidAddressErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidAddressErrMessage, ValidateErrorMessage.ADDRESS);
    });
  });

  describe(`Unvalid checkin offer`, () => {
    it(`doesn't send offer without checkin`, async () => {
      const offerWithoutCheckin = Object.assign({}, VALID_POST_OFFER, {checkin: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutCheckin)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutCheckinErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutCheckinErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with unvalid checkin`, async () => {
      const unvalidChekinOffer = Object.assign({}, VALID_POST_OFFER, {checkin: `99:99`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(unvalidChekinOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidCheckinErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidCheckinErrMessage, ValidateErrorMessage.CHECKIN);
    });
  });

  describe(`Unvalid checkout offer`, () => {
    it(`doesn't send offer without checkout`, async () => {
      const offerWithoutCheckout = Object.assign({}, VALID_POST_OFFER, {checkin: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutCheckout)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutCheckoutErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutCheckoutErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with unvalid checkout`, async () => {
      const unvalidChekoutOffer = Object.assign({}, VALID_POST_OFFER, {checkin: `99:99`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(unvalidChekoutOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidCheckoutErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidCheckoutErrMessage, ValidateErrorMessage.CHECKOUT);
    });
  });

  describe(`Unvalid rooms number offer`, () => {
    it(`doesn't send offer without rooms number`, async () => {
      const offerWithoutRooms = Object.assign({}, VALID_POST_OFFER, {rooms: void 0});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutRooms)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const withoutRoomsErrMessage = response.body[0].errorMessage;

      assert.strictEqual(withoutRoomsErrMessage, ValidateErrorMessage.REQUIRED);
    });

    it(`doesn't send offer with rooms number bigger than ${RoomsQuantity.MAX}`, async () => {
      const offerWithBigRoomsNumber = Object.assign({}, VALID_POST_OFFER, {rooms: 200000});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithBigRoomsNumber)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const bigRoomsNumberErrMessage = response.body[0].errorMessage;

      assert.strictEqual(bigRoomsNumberErrMessage, ValidateErrorMessage.ROOMS);
    });

    it(`doesn't send offer with not a number rooms quantity`, async () => {
      const offerWithNaNRooms = Object.assign({}, VALID_POST_OFFER, {rooms: `i'm thinking about it`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithNaNRooms)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidRoomsErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidRoomsErrMessage, ValidateErrorMessage.ROOMS);
    });
  });

  describe(`Features`, () => {
    it(`should send offer without features`, async () => {
      const offerWithoutFeatures = Object.assign({}, VALID_POST_OFFER);
      delete offerWithoutFeatures.features;

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutFeatures)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.OK)
        .expect(`Content-Type`, /json/);

      const expectedOffer = Object.assign({}, offerWithoutFeatures, {
        features: []
      });

      assert.deepStrictEqual(response.body, expectedOffer);
    });

    it(`should send offer with one feature`, async () => {
      const offerWithoutFeatures = Object.assign({}, VALID_POST_OFFER, {feature: `wifi`});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(offerWithoutFeatures)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.OK)
        .expect(`Content-Type`, /json/);

      assert.deepStrictEqual(response.body, offerWithoutFeatures);
    });

    it(`doesn't send offer with double features`, async () => {
      const doubleFeatureOffer = Object.assign({}, VALID_POST_OFFER, {features: [`wifi`, `parking`, `wifi`]});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(doubleFeatureOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidFeatureErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidFeatureErrMessage, ValidateErrorMessage.FEATURES);
    });

    it(`doesn't send offer with features out of the list`, async () => {
      const unknownFeatureOffer = Object.assign({}, VALID_POST_OFFER, {features: [`wifi`, `parking`, `coffee`]});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(unknownFeatureOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidFeatureErrMessage = response.body[0].errorMessage;
      console.log(unvalidFeatureErrMessage);

      assert.strictEqual(unvalidFeatureErrMessage, ValidateErrorMessage.FEATURES);
    });
  });

  describe(`Name field`, () => {
    it(`add name if offer is post without name`, async () => {
      const withoutNameOffer = Object.assign({}, VALID_POST_OFFER, {name: ``});

      const response = await request(app)
        .post(DEFAULT_PATH)
        .send(withoutNameOffer)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `application/json`)
        .expect(StatusCodes.OK)
        .expect(`Content-Type`, /json/);

      assert.ok(NAMES.includes(response.body.name));
    });
  });

  describe(`Avatar field`, () => {
    it(`doesn't send wrong avatar mimetype offer`, async () => {

      const response = await request(app)
        .post(DEFAULT_PATH)
        .field(`title`, VALID_POST_OFFER.title)
        .field(`type`, VALID_POST_OFFER.type)
        .field(`price`, VALID_POST_OFFER.price)
        .field(`address`, VALID_POST_OFFER.address)
        .field(`checkin`, VALID_POST_OFFER.checkin)
        .field(`checkout`, VALID_POST_OFFER.checkout)
        .field(`rooms`, VALID_POST_OFFER.rooms)
        .attach(`avatar`, `${__dirname}/../static/css/style.css`)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `multipart/form-data`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidAvatarErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidAvatarErrMessage, ValidateErrorMessage.IMAGES);
    });
  });

  describe(`Preview field`, () => {
    it(`doesn't send wrong preview mimetype offer`, async () => {

      const response = await request(app)
        .post(DEFAULT_PATH)
        .field(`title`, VALID_POST_OFFER.title)
        .field(`type`, VALID_POST_OFFER.type)
        .field(`price`, VALID_POST_OFFER.price)
        .field(`address`, VALID_POST_OFFER.address)
        .field(`checkin`, VALID_POST_OFFER.checkin)
        .field(`checkout`, VALID_POST_OFFER.checkout)
        .field(`rooms`, VALID_POST_OFFER.rooms)
        .attach(`preview`, `${__dirname}/../static/css/style.css`)
        .set(`Accept`, `application/json`)
        .set(`Content-Type`, `multipart/form-data`)
        .expect(StatusCodes.BAD_REQUEST)
        .expect(`Content-Type`, /json/);

      const unvalidPreviewErrMessage = response.body[0].errorMessage;

      assert.strictEqual(unvalidPreviewErrMessage, ValidateErrorMessage.IMAGES);
    });
  });
});
