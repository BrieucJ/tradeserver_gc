from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC 
from datetime import datetime
import random
import json
import time
import os

class API():
    def __init__(self, username, password, mode='demo'):
        self.mode = mode
        self.logged_in = False
        self.user_name = username
        self.password = password
        self.user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36'
        self.options = webdriver.ChromeOptions()
        self.options.binary_location = os.environ.get('GOOGLE_CHROME_BIN')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--headless')
        self.options.add_argument('--disable-dev-shm-usage')
        # self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument(f'user-agent={self.user_agent}')
        self.browser = webdriver.Chrome(executable_path=str(os.environ.get('CHROMEDRIVER_PATH')), chrome_options=self.options)
        self.browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": """ Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"""}) #inject js script to hide selenium webdriveer
        self.wait = WebDriverWait(self.browser, 20)
        self.browser.implicitly_wait(20)
        self.login()
    
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
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/watchlists')
        if self.browser.current_url == 'https://www.etoro.com/watchlists':
            print('LOGGED IN')
            self.logged_in = True
            user_name = self.browser.find_element_by_css_selector("a[automation-id='menu-user-page-link']")
            print(user_name)
            print(user_name.text)
        else:
            print('NOT LOGGED IN')
        assert(self.logged_in == True)

    def switch_mode(self):
        time.sleep(10)
        element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        if ('demo-mode' not in element.get_attribute('class').split() and self.mode == 'real') or ('demo-mode' in element.get_attribute('class').split() and self.mode == 'demo'):
            print('Current mode == selected mode')
        else:
            print('Switching')
            switch_btn = self.browser.find_element_by_tag_name('et-select')
            switch_btn.click()
            # self.browser.execute_script("arguments[0].click();", )
            print('click')
            print(self.browser.page_source)
            switch_btns = self.browser.find_elements_by_tag_name('et-select-body-option')
            print(switch_btns)
            # 
            # [0]
            # switch_demo_btn = menu.find_elements_by_tag_name('et-select-body-option')[1]
            # if self.mode == 'real':
            #     print('Switching from demo to real')
            #     switch_real_btn.click()
            #     self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
            #     toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
            #     toggle_btn.click()
            # elif self.mode == 'demo':
            #     print('Switching from real to demo')
                
            #     switch_demo_btn.click()
            #     self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
            #     toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
            #     toggle_btn.click()
            # else:
            #     print('ERROR: unknown mode')
        # print('after if else')
        # time.sleep(1)
        # new_element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        # print(new_element.get_attribute('class'))
        # print('END LOGGING')
        # if self.mode == 'real':
        #     assert('demo-mode' not in new_element.get_attribute('class').split())
        # else:
        #     assert('demo-mode' in new_element.get_attribute('class').split())
    
    def update_portfolio(self):
        print('Updating portfolio')
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
        time.sleep(2)
        empty_portfolio = self.browser.find_elements_by_css_selector("div[class='empty portfolio ng-scope']")
        if len(empty_portfolio) != 0:
            print('Portfolio is empty')
        else:
            print('Portfolio is not empty')
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")
            rows = table.find_elements_by_css_selector("div[data-etoro-automation-id='portfolio-manual-trades-row']")
            for r in rows:
                print(r.text)
        self.close()
    
    def close(self):
        print('Closing api')
        self.browser.close()
        self.logged_in = False