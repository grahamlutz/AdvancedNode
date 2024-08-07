const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  console.log(page.browser());
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
})

test('The header has the correct text', async () => {
  console.log('page: ', page);
  await page.waitForSelector('a.brand-logo');
  const text = await page.getContentsOf('a.brand-logo');

  expect(text).toEqual('Blogster');
});

test('Clicking login starts Oauth flow', async () => {
  await page.waitForSelector('.right a');
  await page.click('.right a');
  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});



