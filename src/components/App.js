import React, { Component } from 'react';
import { Button, Container, Divider, Grid, Header, Image, Menu, Segment, Message, Input } from 'semantic-ui-react';
import { connect } from 'react-redux';

import logo from '../logo.svg';
import './App.css';
import StartButton from './StartButton.js';
import CreateMaker from './CreateMaker.js';
import AuthenticateMaker from './AuthenticateMaker.js';
import OpenCdp from './OpenCdp.js';
import LockEth from './LockEth.js';
import DrawDai from './DrawDai.js';
import WipeDebt from './WipeDebt.js';
import ShutCdp from './ShutCdp.js';
import {RequestQRCode, RequestData} from '@bloomprotocol/share-kit';
import Lottie from 'lottie-react-web'
import animation from './pinjump.json';
import smallTree from './smallTree.json';
import bigTree from './bigTree.json';
import downArrow from './downArrow.json';
import Maker from '@makerdao/dai';
import FundFromWalletDialog from './FundFromWalletDialog';
import { calcMaxDebtInCDP, calcMaxDebtFromWallet, drawDaiAsync} from '../actions';
import io from 'socket.io-client';
import scrollToComponent from 'react-scroll-to-component';
import PieChart from 'react-minimal-pie-chart';

const socket = io("https://daab90ce.ngrok.io");

const BloomQRComponent: React.SFC = props => {
  const requestData = {
  action: "request_attestation_data",
  token: '0x8f31e48a585fd12ba58e70e03292cac712cbae39bc7eb980ec189aa88e24d041',
  url: 'https://daab90ce.ngrok.io',
  org_logo_url: 'https://bloom.co/images/notif/bloom-logo.png',
  org_name: 'Bloom',
  org_usage_policy_url: 'https://bloom.co/legal/terms',
  org_privacy_policy_url: 'https://bloom.co/legal/privacy',
  types: ['phone', 'email'],
}
  return <RequestQRCode requestData={requestData} size={200} />
}

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {maxDebt: 0, maxDebtFromWallet: 0, inputAmount: 0, isVerified: false, showDialog: false,
      neededEth: 0, usd: 0, percentage: 0};
    this.handleClick = this.handleClick.bind(this);
    this.scrollClick = this.scrollClick.bind(this);
    this.onChange = this.onChange.bind(this);
    this.myRef = React.createRef();
    this.handleConfirmTransfer = this.handleConfirmTransfer.bind(this);
    this.handleRangeChange = this.handleRangeChange.bind(this);
  }

  onChange(event) {
     this.setState({inputAmount: event.target.value});
  }

  handleConfirmTransfer(val) {
      console.log("confirmed!");
  }

  scrollClick() {
    scrollToComponent(this.resultPage, {
      offset: 1000,
      align: 'top',
      duration: 1500
    });
  }

  async handleClick(amount) {
    console.log(amount)
    if (!amount || amount == '' || parseFloat(amount <= 0)) {
      return; // no input
    }
    amount = parseFloat(amount);

    const maker = Maker.create("kovan", {
      privateKey: process.env['REACT_APP_PRIVATE_KEY'],
      overrideMetamask: true
    });
    await maker.authenticate();
    let cdpId = process.env['REACT_APP_CDP_ID'];
    const cdp = await maker.getCdp(cdpId ? parseInt(cdpId) : 2836);

    //await drawDaiAsync(maker,cdp, amount);

    const daiDebt = await cdp.getDebtValue();
    const daiDebtString = daiDebt._amount.toString();
    const maxDebt = await calcMaxDebtInCDP(maker, cdp);
    const calculatedMaxDebt = maxDebt-daiDebtString;
    const maxDebtFromWallet = await calcMaxDebtFromWallet(maker, cdp);
    const maxDebtCombined = calculatedMaxDebt + maxDebtFromWallet;

    // if the requested amount is greater than what's available in the CDP
    // bring up the confirmation dialog
    // otherwise, continue
    if (amount > maxDebt) {
      this.setState({
        neededEth: 10,
        usd: 20,
        showDialog: true
      });
      return;
    }
    this.setState({
      maxDebt: Math.round(calculatedMaxDebt*100)/100,
      percentage: calculatedMaxDebt/maxDebtCombined*100,
      maxDebtCombined: Math.round(maxDebtCombined*100)/100,
    });

  }

  async componentDidMount() {
    socket.on('foo', data => {
      console.log("bar", data);
      this.setState({isVerified: true});
    })
    const maker = Maker.create("kovan", {
      privateKey: process.env['REACT_APP_PRIVATE_KEY'],
      overrideMetamask: true
    });
    await maker.authenticate();
    let cdpId = process.env['REACT_APP_CDP_ID'];
    const cdp = await maker.getCdp(cdpId ? parseInt(cdpId) : 2836);

    const daiDebt = await cdp.getDebtValue();
    const daiDebtString = daiDebt._amount.toString();
    const maxDebt = await calcMaxDebtInCDP(maker, cdp);
    const calculatedMaxDebt = maxDebt-daiDebtString;
    const maxDebtFromWallet = await calcMaxDebtFromWallet(maker, cdp);
    const maxDebtCombined = calculatedMaxDebt + maxDebtFromWallet;
    this.setState({
      maxDebt: Math.round(calculatedMaxDebt*100)/100,
      percentage: calculatedMaxDebt/maxDebtCombined*100,
      maxDebtCombined: Math.round(maxDebtCombined*100)/100
    });
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(prevState)
    console.log(this.state)
    if(prevState.isVerified !== this.state.isVerified){
      console.log('scrollClick');
      this.smoothScroll2();
      // this.scrollClick();
    }
  }

  smoothScroll = () => {
    document.querySelector('#app-head-container').scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: 'smooth'
    });
  }

  smoothScroll2 = () => {
    document.querySelector('#testing').scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: 'smooth'
    });
  }

  handleRangeChange(e) {
    const newValue = e.target.value;
    this.setState(() => ({
      percentage: Number(newValue),
      valueToSubmit: parseFloat(Number(newValue) / 100 * this.state.maxDebtCombined).toFixed(2) - this.state.maxDebt
    }));
  }

  render() {

    //console.log(this.state)

    return (

      <div className="App">
        <header className="App-header">
          < h1 className = "App-title" > 🎉LendingParty🎉 </h1>
        </header>
          <br/>
          <a onClick={this.smoothScroll} className="arrow-down">
            <Lottie options={{ animationData: downArrow }} width={50} />
          </a>
          <Lottie options={{ animationData: animation }} width={'100%'} />
          <div id="app-head-container">
            <div id="turquoise" className="ui raised very padded text container segment">
              <h1 className="App-subtitle">Personal loans. Sign up with just your Bloom ID</h1>
              <div id="qr-container">
                {<BloomQRComponent/>}
              </div>
            </div>
          </div>
          <br/>
          <div id="testing" className="ui raised very padded text container segment" ref={(section) => { this.resultPage = section; }}>
            <h1 class="ui header lendContainer">Your Collatoralized Debt Positions</h1>
            <Divider/>
            <div>
              <div className="lendContainer firstContainer">
              <Lottie options={{ animationData: smallTree }} width={450} />
                <div class="ui card">
                  <div class="content">
                    <div class="meta">TOTAL AMOUNT IN CDP</div>
                    <br />
                    <div class="header">${this.state.maxDebt}</div>
                  </div>
                </div>
              </div>
              <div className = "lendContainer firstContainer">
                <Lottie options={{ animationData: bigTree }} width={450} />
                <div class="ui card">
                  <div class="content">
                    <div class="meta">TOTAL AMOUNT LOANABLE </div>
                    <br />
                    <div class="header">${this.state.maxDebtCombined}</div>
                  </div>
                </div>
              </div>
            </div>
            <br />
            <div className>
                <PieChart
                style={{ height: '250px' }}
                data={[{ value: 1, key: 1, color: 'turquoise' }]}
                reveal={this.state.percentage}
                lineWidth={20}
                animate
                />
                Collatoralize: ${parseFloat(this.state.percentage/100 * this.state.maxDebtCombined).toFixed(2)}
                <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={this.state.percentage}
                style={{ width: '100%' }}
                onChange={this.handleRangeChange}
                />
                <div className="lendContainer">
                  <Button size="massive" color="teal" onClick={()=>this.handleClick(this.state.valueToSubmit)}>Go</Button>
                </div>
            </div>

            {this.state.showDialog &&
              <FundFromWalletDialog neededEth={this.state.neededEth} usd={this.state.usd} onConfirm={this.handleConfirmTransfer}/>
            }
            <Divider/>
          </div>

      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { store: state };
};

export default connect(mapStateToProps)(App);
