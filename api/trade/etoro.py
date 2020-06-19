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
        print('Api init')
        print(os.environ.get('GOOGLE_CHROME_BIN', 'chromedriver'))
        print(os.environ.get('CHROMEDRIVER_PATH'))
        self.mode = mode
        self.logged_in = False
        self.user_name = username
        self.password = password
        self.user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36'
        self.options = webdriver.ChromeOptions()
        self.options.binary_location = os.environ.get('GOOGLE_CHROME_BIN', 'chromedriver')
        self.options.add_argument('headless')
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--no-sandbox')
        # self.options.add_argument(f'user-agent={self.user_agent}')
        # self.options.add_argument("--window-size=1920,1080")
        # self.options.add_argument("--incognito")
        self.browser = webdriver.Chrome(executable_path=str(os.environ.get('CHROMEDRIVER_PATH')), options=self.options)
        #self.browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": """ Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"""}) #inject js script to hide selenium webdriveer
        self.wait = WebDriverWait(self.browser, 200)
        self.browser.implicitly_wait(200)
        self.login()
    
    def login(self):
        print('login')
        print(self.user_name)
        print(self.password)
        print(self.browser)
        url = 'https://www.etoro.com/fr/login'
        self.browser.get(url)
        print(self.browser)
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/fr/login')
        print(self.browser.current_url)
        email_field = self.browser.find_element_by_id("username")
        password_field = self.browser.find_element_by_id("password")
        submit_btn = self.browser.find_element_by_xpath('/html/body/ui-layout/div/div/div[1]/login/login-sts/div/div/div/form/div/div[5]/button')
        email_field.send_keys(self.user_name)
        password_field.send_keys(self.password)
        submit_btn.click()
        try:
            self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/watchlists')
            print('LOGGED IN')
            self.logged_in = True
            self.switch_mode()
        except:
            pass

    def switch_mode(self):
        print('switch_mode')
        element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        if (not 'demo-mode' in element.get_attribute('class').split() and self.mode == 'real') or ('demo-mode' in element.get_attribute('class').split() and self.mode == 'demo'):
            print('Current mode == selected mode')
            pass
        else:
            switch_mode_btn = self.browser.find_element_by_tag_name('et-select')
            switch_mode_btn.click()
            switch_real_btn = self.browser.find_element_by_tag_name('et-select-body').find_elements_by_tag_name('et-select-body-option')[0]
            switch_demo_btn = self.browser.find_element_by_tag_name('et-select-body').find_elements_by_tag_name('et-select-body-option')[1]
            if self.mode == 'real':
                print('Switching from demo to real')
                switch_real_btn.click()
                self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
            else:
                print('Switching from real to demo')
                switch_demo_btn.click()
                self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
        
        time.sleep(1)
        new_element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        if self.mode:
            assert(not 'demo-mode' in new_element.get_attribute('class').split())
        else:
            assert('demo-mode' in new_element.get_attribute('class').split())
    
    def update_portfolio(self):
        print('Updating portfolio')
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
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