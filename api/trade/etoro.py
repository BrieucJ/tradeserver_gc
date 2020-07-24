import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC 
from datetime import datetime
from django.contrib.auth.models import User
from django.conf import settings

class API():
    def __init__(self, broker_username, broker_password, mode):
        print('API __init__')
        self.mode = mode
        print(self.mode)
        print(type(settings.PRODUCTION))
        print(settings.PRODUCTION)

        self.user_name = broker_username
        self.password = broker_password
        self.user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36'
        self.options = webdriver.ChromeOptions()
        self.options.binary_location = os.environ.get('GOOGLE_CHROME_BIN')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        # self.options.add_argument("--disable-gpu")
        self.options.add_argument("--start-maximized")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument(f'user-agent={self.user_agent}')
        self.options.add_argument('--headless')
        if settings.PRODUCTION:
            print('USING PROD SETTINGS')
            self.browser = webdriver.Chrome(executable_path=os.environ.get('CHROMEDRIVER_PATH'), options=self.options)
            print(self.browser.capabilities['version'])
        else:
            print('USING DEV SETTINGS')
            self.browser = webdriver.Chrome(executable_path='chromedriver', options=self.options)

        self.wait = WebDriverWait(self.browser, 100)
        self.browser.implicitly_wait(100)
        self.browser.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": """ Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"""}) #inject js script to hide selenium
        self.login()

    # def __del__(self):
    #     self.browser.close()
    
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
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[automation-id='menu-user-page-link']")))
        self.switch_mode()

    def switch_mode(self):
        print('switch_mode')
        current_mode = self.browser.find_element_by_tag_name('header').find_element_by_xpath('..').get_attribute('class').split()
        if ('demo-mode' in current_mode and self.mode == 'real') or ('demo-mode' not in current_mode and self.mode == 'demo'):
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'et-select')))
            switch_btn = self.browser.find_element_by_tag_name('et-select')
            switch_btn.click()
            self.wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, 'et-select-body-option')))
            mode_btns = self.browser.find_elements_by_tag_name('et-select-body-option')
            if self.mode == 'real':
                print('switching from demo to real')
                mode_btns[0].click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
                toggle_btn = self.browser.find_element_by_css_selector("a[class='toggle-account-button']")
                toggle_btn.click()
                self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
            elif self.mode == 'demo':
                print('switching from real to demo')
                mode_btns[1].click()
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[class='toggle-account-button']")))
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
        self.wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, 'et-account-balance')))
        #PORTFOLIO
        cash = self.browser.find_element_by_css_selector("span[automation-id='account-balance-availible-unit-value']").text
        total_invested_value = self.browser.find_element_by_css_selector("span[automation-id='account-balance-amount-unit-value']").text
        portfolio = {'portfolio_type': True if self.mode == 'real' else False, 'cash': cash, 'total_invested_value': total_invested_value}
        if len(empty_portfolio) == 0:
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
                position = {'ticker': ticker, 'invest_date': invest_date, 'invested_value': invested_value, 'invested_units': invested_units, 'open_rate': open_rate, 'current_rate': current_rate, 'stop_loss_rate': stop_loss_rate, 'take_profit_rate': take_profit_rate}
                positions.append(position)
        else:
            positions = []
        print(portfolio)
        print(positions)
        return portfolio, positions
    
    def get_pending_order(self):
        print('get_pending_order')
        self.browser.get('https://www.etoro.com/portfolio/orders')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/orders')
        empty_order_book = self.browser.find_elements_by_css_selector("div[class='w-portfolio-table-empty']")
        pending_orders = []
        print(len(empty_order_book))
        if len(empty_order_book) == 0:
            table = self.browser.find_element_by_css_selector("ui-table[data-etoro-automation-id='orders-table']")
            rows = table.find_elements_by_css_selector("div[class='ui-table-row-container ng-scope']")
            for r in rows:
                order_type = len(r.find_elements_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-action-buy']"))
                ticker = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-action-market-name']").text
                total_investment = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-amount']").text
                open_rate = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-rate-order']").text
                current_price = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-current-rate']").text
                stop_loss = r.find_element_by_css_selector("span[data-etoro-automation-id='orders-table-body-cell-sl']").text
                take_profit = r.find_element_by_css_selector("ui-table-cell[data-etoro-automation-id='orders-table-body-cell-tp']").text
                date = r.find_element_by_css_selector("p[data-etoro-automation-id='orders-table-body-cell-open-date-date-value']").text
                time = r.find_element_by_css_selector("p[data-etoro-automation-id='orders-table-body-cell-open-date-time-value']").text
                date_time = date + ' ' + time
                submited_at = datetime.strptime(date_time, "%d/%m/%Y %H:%M:%S")
                order = {'ticker': ticker, 'order_type':order_type, 'total_investment': total_investment, 'open_rate': open_rate, 'current_price': current_price, 'stop_loss': stop_loss, 'take_profit': take_profit, 'submited_at': submited_at}
                pending_orders.append(order)
        return pending_orders

    def execute_buy_order(self, order):
        print('execute_buy_order')
        self.browser.get(f'https://www.etoro.com/markets/{str(order.stock.symbol).lower()}')
        self.wait.until(lambda driver: self.browser.current_url == f'https://www.etoro.com/markets/{str(order.stock.symbol).lower()}')
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'trade-button')))
        time.sleep(1) #dirty fix!!
        trade_btn = self.browser.find_element_by_css_selector('trade-button')
        trade_btn.click()
        self.wait.until(EC.visibility_of(self.browser.find_element_by_id("open-position-view")))


        #SWITCH TO ORDER MODE IF PRESENT (to be investigated)
        print('SWITCH TO ORDER MODE IF PRESENT')
        toggle_btn = self.browser.find_elements_by_css_selector("div[data-etoro-automation-id='execution-trade-mode-drop-box']")
        if len(toggle_btn) !=0:
            print('SWITCH TO ORDER MODE')
            toggle_btn[0].click()
            order_btn = self.browser.find_element_by_css_selector("a[data-etoro-automation-id='execution-trade-mode-switch-to-order']")
            order_btn.click()
        
        self.wait.until(EC.visibility_of(self.browser.find_element_by_css_selector("div[class='set-rate']")))

        
        buy_btn = self.browser.find_element_by_css_selector("button[data-etoro-automation-id='execution-buy-button']")
        buy_btn.click()
        print('buy_btn click')

        #ORDER TYPE SWITCH
        switch_order_rate_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-button-switch-order-rate']")
        switch_units_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-button-switch-to-units']")
        if len(switch_order_rate_btn) != 0:
            print('switched to order_rate')
            switch_order_rate_btn[0].click()
        if len(switch_units_btn) != 0:
            switch_units_btn[0].click()
            print('switched to units')

        # PRICE AND SHARE INPUT (order is important)
        price_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-order-rate-input-section']").find_element_by_css_selector("input[data-etoro-automation-id='input']")
        share_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-units-input-section']").find_element_by_tag_name("input")

        # clearing price input before inserting data selenium .clear() not working input max_chars=12
        price_input.click()
        for _ in range(12):
            price_input.send_keys(Keys.ARROW_RIGHT)
            price_input.send_keys(Keys.BACK_SPACE)
        time.sleep(1)
        price_input.send_keys(str(order.order_price))
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
            print('switch-to-rate-button')
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
        take_profit_switch_btn = self.browser.find_elements_by_css_selector("a[data-etoro-automation-id='execution-take-profit-rate-editing-switch-to-rate-button']")
        if len(take_profit_switch_btn) != 0:
            print('switch-to-rate-button')
            stop_loss_switch_btn[0].click()
        take_profit_input = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='execution-take-profit-rate-input']").find_element_by_css_selector("input[data-etoro-automation-id='input']")
        for _ in range(12):
            take_profit_input.send_keys(Keys.ARROW_RIGHT)
            take_profit_input.send_keys(Keys.BACK_SPACE)
        time.sleep(1)
        take_profit_input.send_keys(str(order.take_profit))
        take_profit_input.send_keys(Keys.ENTER)

        #PLACE ORDER
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-etoro-automation-id='execution-open-order-button']")))
        place_order_btn = self.browser.find_element_by_css_selector("button[data-etoro-automation-id='execution-open-order-button']")
        place_order_btn.click()

    def execute_sell_order(self, order):
        print('execute_sell_order')
        self.browser.get('https://www.etoro.com/portfolio')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio')
        row = self.browser.find_element_by_css_selector(f"div[data-etoro-automation-id='portfolio-overview-row-{order.stock.symbol}']")
        dropdown_btn = row.find_element_by_css_selector("div[data-etoro-automation-id='portfolio-overview-table-body-cell-cogeWhell']")
        dropdown_btn.click()
        close_btn = row.find_element_by_css_selector("div[data-etoro-automation-id='drop-down-actions-option-instrument-close']")
        close_btn.click()
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-etoro-automation-id='close-all-positions-window']")))
        close_modal = self.browser.find_element_by_css_selector("div[data-etoro-automation-id='close-all-positions-window']")
        check = close_modal.find_element_by_css_selector("label[data-etoro-automation-id='close-all-positions-selection-label']")
        check.click()
        self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-etoro-automation-id='close-all-positions-closs-all-button']")))
        sell_button = close_modal.find_element_by_css_selector("button[data-etoro-automation-id='close-all-positions-closs-all-button']")
        sell_button.click()

    def cancel_order(self, order):
        self.browser.get('https://www.etoro.com/portfolio/orders')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/orders')
        row = self.browser.find_element_by_css_selector(f"div[data-etoro-automation-id='orders-table-row-{order.stock.symbol}']")
        cancel_btn = row.find_element_by_css_selector("a[data-etoro-automation-id='orders-table-body-close-order-action']")
        cancel_btn.click()
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-etoro-automation-id='close-all-positions-window']")))
        cancel_modal = self.browser.find_element_by_css_selector("div[class='close-order-container']")
        execute_btn = cancel_modal.find_element_by_css_selector("button[class^='close-order-button']") # ^ => partial class match
        execute_btn.click()

    def update_trade_history(self):
        print('update_trade_history')
        self.browser.get('https://www.etoro.com/portfolio/history')
        self.wait.until(lambda driver: self.browser.current_url == 'https://www.etoro.com/portfolio/history')
        trade_history = []
        rows = self.browser.find_elements_by_css_selector("div[class='ui-table-row ng-scope']")
        print(len(rows))
        for r in rows:
            ticker = r.find_element_by_css_selector("div[class='i-portfolio-table-name']").text.split(' ')[1]
            infos = r.find_element_by_tag_name("ui-table-body-slot").find_elements_by_tag_name("ui-table-cell")
            total_investment = infos[0].text
            num_of_shares = infos[1].text
            open_rate = infos[2].text
            open_date = infos[3].text
            close_rate = infos[4].text
            close_date = infos[5].text
            p_l = infos[6].text
            hist = {'ticker': ticker, 'total_investment': total_investment, 'num_of_shares': num_of_shares, 'open_rate': open_rate, 'open_date': open_date, 'close_rate': close_rate, 'p_l': p_l}
            trade_history.append(hist)
        return trade_history

    def transmit_orders(self, orders):
        print('transmit orders')
        print(orders)
        for order in orders:
            #BUY/SELL SWITCH
            if str(order.__class__.__name__) == 'BuyOrder':
                print('BUY')
                if order.canceled_at != None:
                    print('CANCELING BUY ORDER')
                    self.cancel_order(order)
                else:
                    self.execute_buy_order(order)
            elif str(order.__class__.__name__) == 'SellOrder':
                
                if order.canceled_at != None:
                    print('CANCELING SELL ORDER')
                    self.cancel_order(order)
                else:
                    print('SELL')
                    self.execute_sell_order(order)
            else:
                print('Error unknown order_type')
                continue
            
