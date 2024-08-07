const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.setCacheEnabled(false)
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('When logged in', () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('shows logout button', async () => {
    await page.waitForSelector('a[href="/auth/logout"]');
    const text = await page.getContentsOf('a[href="/auth/logout"]');
  
    expect(text).toMatch('Logout');
  });

  test( 'can see blog create form', async () => {
    await page.waitForSelector('form label');
    const label = await page.getContentsOf('form label');

    expect(label).toEqual('Blog Title');
  });

  describe('And using VALID inputs', () => {
    beforeEach(async () => { 
      await page.waitForSelector('.title input');
      await page.type('.title input', 'My Test Title');
      await page.type('.content input', 'My test content');
      await page.click('form button');
    });

    test('Submitting takes user to review screen', async () => {
      await page.waitForSelector('h5');
      const text = await page.getContentsOf('h5');

      expect(text).toEqual('Please confirm your entries');
    });

    test('Submitting then saving adds blog to "Blog Index" page', async () => {
      await page.waitForSelector('button.green');
      await page.click('button.green');
      await page.waitForSelector('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('My Test Title');
      expect(content).toEqual('My test content');
    });
  });

  describe('And using INVALID inputs', () => {
    beforeEach(async () => { 
      await page.waitForSelector('form button');
      await page.click('form button');
      await page.waitForSelector('.title .red-text');
    });

    test('the form shows an error message', async () => {
      const titleErrorMessage = await page.getContentsOf('.title .red-text');
      const contentErrorMessage = await page.getContentsOf('.content .red-text');

      expect(titleErrorMessage).toEqual('You must provide a value');
      expect(contentErrorMessage).toEqual('You must provide a value');
    });
  });
});

describe('When not logged in', () => {
  const actions = [
    {
      method: 'post',
      path: '/api/blogs',
      data:  { title: 'My Test Title', content: 'My test content' }
    },
    {
      method: 'get',
      path: '/api/blogs'
    }
  ];

  test('User cannot do blog things', async () => {
    const results = await page.execRequests(actions);

    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });
});