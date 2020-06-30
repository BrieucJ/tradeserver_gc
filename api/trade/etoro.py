import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC 
from datetime import datetime
from django.contrib.auth.models import User


class API():
    def __init__(self, broker_username, broker_password, mode='demo'):
        print('API __init__')
        self.mode = mode
        self.logged_in = False
        self.user_name = broker_username
        self.password = broker_password
        self.user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36'
        self.options = webdriver.ChromeOptions()
        self.options.binary_location = os.environ.get('GOOGLE_CHROME_BIN')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--headless')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument(f'user-agent={self.user_agent}')
        self.browser = webdriver.Chrome(executable_path=str(os.environ.get('CHROMEDRIVER_PATH')), chrome_options=self.options)
        self.browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": """ Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"""}) #inject js script to hide selenium webdriveer
        self.wait = WebDriverWait(self.browser, 100)
        self.browser.implicitly_wait(10)
        self.login()

    def __del__(self):
        self.browser.close()
        self.logged_in = False
    
    def login(self):
        print('login')
        url = 'https://www.etoro.com/fr/login'
        self.browser.get(url)
        email_field = self.browser.find_element_by_id("username")
        password_field = self.browser.find_element_by_id("password")
        submit_btn = self.browser.find_element_by_xpath('/html/body/ui-layout/div/div/div[1]/login/login-sts/div/div/div/form/div/div[5]/button')
        email_field.send_keys(self.user_name)
        password_field.send_keys(self.password)
        submit_btn.click()
        try:
            self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/watchlists')
            self.logged_in = True
        except:
            self.logged_in = False
        
        if self.logged_in:
            self.switch_mode()

    def switch_mode(self):
        print('switch_mode')
        current_mode = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..').get_attribute('class').split()
        if ('demo-mode' in current_mode and self.mode == 'real') or ('demo-mode' not in current_mode and self.mode == 'demo'):
            self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, 'et-select')))
            switch_btn = self.browser.find_element_by_tag_name('et-select')
            switch_btn.click()
            try:
                self.wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, 'et-select-body-option')))
            except TimeoutException as err:
                print('Timed out')
                print(switch_btn.get_attribute('innerHTML'))
                print(err)

            mode_btns = self.browser.find_elements_by_tag_name('et-select-body-option')
            if self.mode == 'real':
                mode_btns[0].click()
                self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
                self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
            elif self.mode == 'demo':
                mode_btns[1].click()
                self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
                self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
            new_element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        
        if self.mode == 'real':
            assert('demo-mode' not in new_element.get_attribute('class').split())
        else:
            assert('demo-mode' in new_element.get_attribute('class').split())
    
    def update_portfolio(self):
        print('update_portfolio')
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
        empty_portfolio = self.browser.find_elements_by_css_selector("div[class='empty portfolio ng-scope']")
        if len(empty_portfolio) == 0:
            #PORTFOLIO
            cash = self.browser.find_element_by_css_selector("span[data-etoro-automation-id='account-balance-availible-unit-value']").text
            total_invested_value = self.browser.find_element_by_css_selector("span[data-etoro-automation-id='account-balance-amount-unit-value']").text
            portfolio = {'portfolio_type': True if self.mode == 'real' else False, 'cash': float(cash), 'total_invested_value': float(total_invested_value)}

            #POSITIONS
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")
            rows = table.find_elements_by_css_selector("div[data-etoro-automation-id='portfolio-manual-trades-row']")
            positions = []
            for r in rows:
                ticker = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-name']").text
                invest_date = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-open-date']").text
                invested_value = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-invested-value']").text
                invested_units = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-units-value']").text
                open_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-open-rate']").text
                current_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-last-price']").text
                stop_loss_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-stop-loss-rate']").text
                take_profit_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-take-profit-rate']").text
                # invest_date_obj = datetime.datetime.strptime(invest_date, '%Y/%m/%d %H:%M')
                position = {'ticker': ticker, 'invest_date': invest_date, 'invested_value': invested_value, 'invested_units': invested_units, 'open_rate': open_rate, 'current_rate': current_rate, 'stop_loss_rate': stop_loss_rate, 'take_profit_rate': take_profit_rate}
                positions.append(position)
        else:
            portfolio = {'portfolio_type': True if self.mode == 'real' else False, 'cash': None, 'total_invested_value': None}
            positions = []
        
        return portfolio, positions