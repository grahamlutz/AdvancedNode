const pup = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class Page {
  static async build() {
    const browser = await pup.launch({
      headless: false
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36');
    const customPage = new Page(page);
    
    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
    
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(path) {
    return this.page.evaluate(
      (_path) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: 'My Test Title', content: 'My test content' })
        }).then(res => res.json());
      },
      path
    );
  }

  post(path, body) {
    return this.page.evaluate(
      (_path, _body) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(_body)
        }).then(res => res.json());
      },
      path,
      body
    );
  }

  execRequests(actions) {
    return Promise.all(actions.map(({method, path, data}) => {
      return this[method](path, data);
    }));
  }
}

module.exports = Page;