import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

import random
from re import sub
from decimal import Decimal
from datetime import datetime
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone

class API():
    def __init__(self, broker_username, broker_password, mode):
        print(f'API __init__ {mode}')
        self.start_time = time.time()
        self.mode = mode
        self.user_name = broker_username
        self.password = broker_password
        self.user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36'
        self.options = webdriver.ChromeOptions()
        if settings.PRODUCTION:
            self.options.binary_location = os.environ['GOOGLE_CHROME_BIN']
        self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--start-maximized")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument(f'user-agent={self.user_agent}')
        
        self.browser = webdriver.Chrome(ChromeDriverManager().install(), options=self.options)
        self.wait = WebDriverWait(self.browser, 100)
        self.browser.implicitly_wait(10)
        self.browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": """ Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"""}) #inject js script to hide selenium
        if self.mode != 'test':
            self.login()

    def __del__(self):
        self.browser.close()
        self.browser.quit()
        self.browser = None
        print(f'ETORO took {round(time.time() - self.start_time)} seconds')
    
    def login(self):
        start_time = time.time()
        url = 'https://www.etoro.com/fr/login'
        self.browser.get(url)
        email_field = self.browser.find_element_by_id("username")
        password_field = self.browser.find_element_by_id("password")
        submit_btn = self.browser.find_element_by_xpath('/html/body/ui-layout/div/div/div[1]/login/login-sts/div/div/div/form/div/div[5]/button')
        email_field.send_keys(self.user_name)
        password_field.send_keys(self.password)
        submit_btn.click()
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/watchlists')
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[automation-id='menu-user-page-link']")))
        self.switch_mode()
        print(f'Login took {round(time.time() - start_time)} seconds')

    def switch_mode(self):
        start_time = time.time()
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "div[class='e-screen active']")))
        current_mode = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..').get_attribute('class').split()
        if ('demo-mode' in current_mode and self.mode == 'real') or ('demo-mode' not in current_mode and self.mode == 'demo'):
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'et-select')))
            switch_btn = self.browser.find_element_by_tag_name('et-select')
            switch_btn.click()
            self.wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, 'et-select-body-option')))
            mode_btns = self.browser.find_elements_by_tag_name('et-select-body-option')
            if self.mode == 'real':
                mode_btns[0].click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
            elif self.mode == 'demo':
                mode_btns[1].click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[class='ng-scope demo-mode']")))

        new_element = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..')
        if self.mode == 'real':
            assert('demo-mode' not in new_element.get_attribute('class').split())
        else:
            assert('demo-mode' in new_element.get_attribute('class').split())
        print(f'Switch mode took {round(time.time() - start_time)} seconds')

    def validate_ticker(self, ticker):
        self.browser.get(f'https://www.etoro.com/markets/{ticker.lower()}')
        try:
            self.wait.until(lambda driver: self.browser.current_url == f'https://www.etoro.com/markets/{ticker.lower()}')
        except TimeoutException as err:
            return False
            print(err)
        try:
            self.browser.find_element_by_css_selector("h1[automation-id='market-header-nickname']")
        except NoSuchElementException as err:
            print(err)
            return False
        else:
            if self.browser.find_element_by_css_selector("h1[automation-id='market-header-nickname']").text.lower() == ticker.lower():
                return True
            else:
                return False
    
    def update_portfolio(self):
        start_time = time.time()
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
        empty_portfolio = self.browser.find_elements_by_css_selector("div[class='empty portfolio ng-scope']")
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'et-account-balance')))

        #PORTFOLIO
        cash = self.browser.find_element_by_css_selector("span[automation-id='account-balance-availible-unit-value']").text
        total_invested_value = self.browser.find_element_by_css_selector("span[automation-id='account-balance-amount-unit-value']").text
        latent_p_l = self.browser.find_element_by_css_selector("div[automation-id='account-balance-profit-unit']").find_element_by_css_selector("span[class^='footer-unit-value']").text
        if cash == None or total_invested_value == None:
            cash_value = None
            total_invested_val = None
            latent_p_l = None
            currency = '$'
        else:
            cash_value = Decimal(sub(r'[^\d.]', '', str(cash)))
            total_invested_val = Decimal(sub(r'[^\d.]', '', str(total_invested_value)))
            latent_p_l = Decimal(str(latent_p_l.replace('$','').replace(',','')))
            currency = cash[0]

        portfolio = {'portfolio_type': True if self.mode == 'real' else False, 'cash': cash_value, 'total_invested_value': total_invested_val, 'latent_p_l': latent_p_l ,'currency': currency}
        print(portfolio)
        if len(empty_portfolio) == 0:
            #POSITIONS
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")))
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")
            rows = table.find_elements_by_css_selector("div[data-etoro-automation-id='portfolio-manual-trades-row']")
            positions = []
            for r in rows:
                try:
                    ticker = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-name']").text
                    open_date = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-open-date']").text
                    total_investment = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-invested-value']").text
                    num_of_shares = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-units-value']").text
                    open_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-open-rate']").text
                    current_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-last-price']").text
                    stop_loss_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-stop-loss-rate']").text
                    take_profit_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-take-profit-rate']").text
                except NoSuchElementException as err:
                    pass
                else:                 
                    position = {'ticker': ticker, 'open_date': datetime.strptime(open_date, "%d/%m/%Y %H:%M").replace(tzinfo=timezone.utc), 'total_investment': Decimal(sub(r'[^\d.]', '', str(total_investment))), 'num_of_shares': float(num_of_shares), 'open_rate': float(open_rate.replace(',','')), 'current_rate': float(current_rate.replace(',','')), 'stop_loss_rate': float(stop_loss_rate.replace(',','')), 'take_profit_rate': float(take_profit_rate.replace(',','')) }
                    positions.append(position)
        else:
            positions = []
        print(f'Update portfolio took {round(time.time() - start_time)} seconds')
        return portfolio, positions

    def get_pending_order(self):
        start_time = time.time()
        self.browser.get('https://www.etoro.com/portfolio/orders')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/orders')
        empty_order_book = self.browser.find_elements_by_css_selector("div[class='w-portfolio-table-empty']")
        pending_orders = []

        #buy orders
        if len(empty_order_book) == 0:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ui-table[data-etoro-automation-id='orders-table']")))
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='orders-table']")
            rows = table.find_elements_by_css_selector("div[class='ui-table-row-container ng-scope']")
            for r in rows:
                order_type = len(r.find_elements_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-action-buy']"))
                ticker = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-action-market-name']").text
                total_investment = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-amount']").text
                order_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-rate-order']").text
                current_rate = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-current-rate']").text
                stop_loss = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-sl']").text
                take_profit = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-tp']").text
                date = r.find_element_by_css_selector("p[data-etoro-automation-id='orders-table-body-cell-open-date-date-value']").text
                hour = r.find_element_by_css_selector("p[data-etoro-automation-id='orders-table-body-cell-open-date-time-value']").text
                date_time = date + ' ' + hour
                submited_at = datetime.strptime(date_time, "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc)
                order = {'ticker': ticker, 'order_type': order_type, 'total_investment': float(Decimal(sub(r'[^\d.]', '', str(total_investment)))), 'num_of_shares': int(float(Decimal(sub(r'[^\d.]', '', str(total_investment))))/float(order_rate.replace(',',''))), 'order_rate': float(order_rate.replace(',','')), 'current_rate': float(current_rate.replace(',','')), 'stop_loss': float(stop_loss.replace(',','')), 'take_profit': float(take_profit.replace(',','')), 'submited_at': submited_at}
                pending_orders.append(order)
        
        #sell orders
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
        empty_portfolio = self.browser.find_elements_by_css_selector("div[class='empty portfolio ng-scope']")

        if len(empty_portfolio) == 0:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")))
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='portfolio-manual-trades-table']")
            rows = table.find_elements_by_css_selector("div[data-etoro-automation-id='portfolio-manual-trades-row']")
            positions = []
            for r in rows:
                row_is_sell_order = r.find_elements_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-pending-close']")
                if len(row_is_sell_order) != 0:
                    order_type = 0
                    ticker = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-name']").text
                    total_investment = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-invested-value']").text
                    num_of_shares = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='portfolio-manual-trades-table-body-cell-container-units']").text
                    open_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-open-rate']").text
                    current_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-last-price']").text
                    stop_loss = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-stop-loss-rate']").text
                    take_profit = r.find_element_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-take-profit-rate']").text
                    order = {'ticker': ticker, 'order_type': order_type, 'total_investment': Decimal(sub(r'[^\d.]', '', str(total_investment))), 'num_of_shares': int(float(num_of_shares.replace(',',''))), 'open_rate': float(open_rate.replace(',','')), 'current_rate': float(current_rate.replace(',','')), 'stop_loss': float(stop_loss.replace(',','')), 'take_profit': float(take_profit.replace(',',''))}
                    pending_orders.append(order)
        
        print(f'Update pending orders took {round(time.time() - start_time)} seconds')
        return pending_orders

    def update_trade_history(self):
        start_time = time.time()
        self.browser.get('https://www.etoro.com/portfolio/history')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/history')

        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[class='dropdown-menu']")))
        dropdown_btn = self.browser.find_element_by_css_selector("div[class='dropdown-menu']")
        dropdown_btn.click()
        time.sleep(1) #dirty fix
        dropdown = self.browser.find_element_by_css_selector("div[class='drop-select-box']")
        options = dropdown.find_elements_by_tag_name('a')
        options[4].click()

        self.wait.until(EC.invisibility_of_element((By.CSS_SELECTOR, "div[class='ui-table-hat ng-scope loading']")))
        trade_history = []
        table = self.browser.find_element_by_tag_name('ui-table')
        rows = table.find_elements_by_css_selector("div[class='ui-table-row ng-scope']")
        for r in rows:
            ticker = r.find_element_by_css_selector("div[class='i-portfolio-table-name']").text.split(' ')[-1]
            infos = r.find_element_by_tag_name("ui-table-body-slot").find_elements_by_tag_name("ui-table-cell")
            total_investment = infos[0].text
            num_of_shares = infos[1].text
            open_rate = infos[2].text
            open_date = infos[3].text
            close_rate = infos[4].text
            close_date = infos[5].text
            if bool(infos[1].text) == False:
                continue
            else:
                hist = {'ticker': ticker, 'total_investment': Decimal(sub(r'[^\d.]', '', str(total_investment))), 'num_of_shares': int(float(num_of_shares)), 'open_rate': float(open_rate.replace(',','')), 'open_date': datetime.strptime(str(open_date.replace('\n', ' ')), "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc), 'close_rate': float(close_rate.replace(',','')), 'close_date': datetime.strptime(str(close_date.replace('\n', ' ')), "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc)}
                trade_history.append(hist)

        print(f'Update Trade history took {round(time.time() - start_time)} seconds')
        return trade_history

    def execute_buy_order(self, order):
        start_time = time.time()
        self.browser.get(f'https://www.etoro.com/markets/{str(order.stock.symbol).lower()}')
        try:
            self.wait.until(EC.element_to_be_clickable((By.TAG_NAME, 'trade-button')))
        except TimeoutException as err:
            pass
        else:
            trade_btn = self.browser.find_element_by_tag_name('trade-button')
            time.sleep(5) #dirty fix
            trade_btn.click()
            try:
                self.browser.find_element_by_css_selector("div[id='open-position-view']")
            except NoSuchElementException as err:
                pass
            else:
                #SWITCH TO ORDER MODE IF PRESENT (to be investigated)
                toggle_btn = self.browser.find_elements_by_css_selector("div[data-etoro-automation-id='execution-trade-mode-drop-box']")
                if len(toggle_btn) !=0:
                    toggle_btn[0].click()
                    order_btn = self.browser.find_element_by_css_selector("a[data-etoro-automation-id='execution-trade-mode-switch-to-order']")
                    order_btn.click()
                
                self.wait.until(EC.visibility_of(self.browser.find_element_by_css_selector("div[class='set-rate']")))

                buy_btn = self.browser.find_element_by_css_selector("button[data-etoro-automation-id='execution-buy-button']")
                buy_btn.click()

                #ORDER TYPE SWITCH
                switch_order_rate_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-button-switch-order-rate']")
                switch_units_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-button-switch-to-units']")
                if len(switch_order_rate_btn) != 0:
                    switch_order_rate_btn[0].click()
                if len(switch_units_btn) != 0:
                    switch_units_btn[0].click()

                # PRICE AND SHARE INPUT (order is important)
                price_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-order-rate-input-section']").find_element_by_css_selector("input[data-etoro-automation-id='input']")
                share_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-units-input-section']").find_element_by_tag_name("input")

                # clearing price input before inserting data selenium .clear() not working input max_chars=12
                price_input.click()
                for _ in range(12):
                    price_input.send_keys(Keys.ARROW_RIGHT)
                    price_input.send_keys(Keys.BACK_SPACE)
                time.sleep(1)
                price_input.send_keys(str(order.order_rate))
                price_input.send_keys(Keys.ENTER)

                # clearing share input before inserting data selenium .clear() not working input max_chars=12
                share_input.click()
                for _ in range(12):
                    share_input.send_keys(Keys.ARROW_RIGHT)
                    share_input.send_keys(Keys.BACK_SPACE)
                time.sleep(1)
                share_input.send_keys(str(order.num_of_shares))
                share_input.send_keys(Keys.ENTER)

                #STOP LOSS
                stop_loss_btn = self.browser.find_element_by_css_selector("tabtitle[name='stopLoss']")
                stop_loss_btn.click()
                stop_loss_switch_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-stop-loss-amount-editing-switch-to-rate-button']")
                if len(stop_loss_switch_btn) != 0:
                    stop_loss_switch_btn[0].click()
                
                stop_loss_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-stop-loss-rate-input']").find_element_by_css_selector("input[data-etoro-automation-id='input']")
                for _ in range(12):
                    stop_loss_input.send_keys(Keys.ARROW_RIGHT)
                    stop_loss_input.send_keys(Keys.BACK_SPACE)
                time.sleep(1)
                stop_loss_input.send_keys(str(order.stop_loss))
                stop_loss_input.send_keys(Keys.ENTER)

                #TAKE PROFIT
                take_profit_btn = self.browser.find_element_by_css_selector("tabtitle[name='takeProfit']")
                take_profit_btn.click()
                take_profit_switch_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-take-profit-amount-editing-switch-to-rate-button']")
                if len(take_profit_switch_btn) != 0:
                    print('switch-to-rate-button')
                    take_profit_switch_btn[0].click()

                take_profit_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-take-profit-rate-input']").find_element_by_css_selector("input[data-etoro-automation-id='input']")
                for _ in range(12):
                    take_profit_input.send_keys(Keys.ARROW_RIGHT)
                    take_profit_input.send_keys(Keys.BACK_SPACE)
                time.sleep(1)
                take_profit_input.send_keys(str(order.take_profit))
                take_profit_input.send_keys(Keys.ENTER)

                #PLACE ORDER
                try:
                    self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-etoro-automation-id='execution-open-order-button']")))
                except TimeoutException as err:
                    pass
                else:
                    place_order_btn = self.browser.find_element_by_css_selector("button[data-etoro-automation-id='execution-open-order-button']")
                    place_order_btn.click()
        print(f'Execute {order.stock.symbol} buy order took {round(time.time() - start_time)} seconds')


    def execute_sell_order(self, order):
        start_time = time.time()
        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
        try:
            ticker_element = self.browser.find_element_by_xpath(f"//span[contains(text(),'{order.stock.symbol}')]")
            row = ticker_element.find_element_by_xpath(".//ancestor::div[contains(@data-etoro-automation-id, 'portfolio-manual-trades-row')]")
            row_pending_sell = row.find_elements_by_css_selector("span[data-etoro-automation-id='portfolio-manual-trades-table-body-market-pending-close']")
        except Exception:
            print(Exception)
            pass
        else:
            if len(row_pending_sell) == 0:
                close_btn = row.find_element_by_css_selector("div[data-etoro-automation-id='portfolio-manual-trades-table-body-close-button']")
                close_btn.click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-etoro-automation-id='close-position-table']")))
                close_modal = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='close-position-table']")
                self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-etoro-automation-id='close-position-close-button']")))
                sell_button = close_modal.find_element_by_css_selector("button[data-etoro-automation-id='close-position-close-button']")
                sell_button.click()
        print(f'Execute sell order took {round(time.time() - start_time)} seconds')


    def cancel_order(self, order):
        start_time = time.time()
        self.browser.get('https://www.etoro.com/portfolio/orders')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/orders')
        empty_order_book = self.browser.find_elements_by_css_selector("div[class='w-portfolio-table-empty']")
        if len(empty_order_book) == 0:
            try:
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "ui-table[data-etoro-automation-id='orders-table']")))
                row = self.browser.find_element_by_css_selector(f"div[data-etoro-automation-id='orders-table-row-{order.stock.symbol}']")
                cancel_btn = row.find_element_by_css_selector("a[data-etoro-automation-id='orders-table-body-close-order-action']")
                cancel_btn.click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[class='close-order-container']")))
                cancel_modal = self.browser.find_element_by_css_selector("div[class='close-order-container']")
                execute_btn = cancel_modal.find_element_by_css_selector("button[class^='close-order-button']") # ^ => partial class match
                execute_btn.click()
            except:
                print(f'Order {order.stock.symbol} not in order book')
                pass
        print(f'Execute {order.stock.symbol} cancel order took {round(time.time() - start_time)} seconds')

    
    def transmit_orders(self, orders):
        start_time = time.time()
        for order in orders:
            #BUY/SELL SWITCH
            if str(order.__class__.__name__) == 'BuyOrder':
                if order.canceled_at != None:
                    self.cancel_order(order)
                else:
                    #pending order check
                    try:
                        self.browser.get('https://www.etoro.com/portfolio/orders')
                        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/orders')
                        pending_buy_order = self.browser.find_elements_by_css_selector(f"div[data-etoro-automation-id='orders-table-row-{order.stock.symbol}']")
                        #portfolio check
                        self.browser.get('https://www.etoro.com/portfolio/manual-trades')
                        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/manual-trades')
                        order_in_portfolio = self.browser.find_elements_by_xpath(f"//div[@class='table-first-name']/span[text()='{order.stock.symbol}']")
                    except:
                        print('ERROR')
                    else:
                        if len(pending_buy_order) != 0:
                            print(f'ORDER ALREADY IN ORDER BOOK - {order.stock.symbol}')
                            pass
                        elif len(order_in_portfolio) != 0:
                            print(f'ORDER ALREADY IN PORTFOLIO - {order.stock.symbol}')
                            pass
                        else:
                            self.execute_buy_order(order)

            elif str(order.__class__.__name__) == 'SellOrder':
                self.execute_sell_order(order)
            else:
                print('Error unknown order_type')
                continue
        print(f'Transmit {len(orders)} orders took {round(time.time() - start_time)} seconds')

