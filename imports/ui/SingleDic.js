import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withLocalize } from "react-localize-redux";
import { Translate } from "react-localize-redux";

import resultsTranslations from '../translations/results.json';
import dicStruct from '../api/dictionary_struct';
import BriefWord from './BriefWord';

class SingleDic extends Component {
    constructor(props) {
        super(props);

        props.addTranslation(resultsTranslations);

        let state = props.location.state;
        if (!state) {
            props.history.replace('/');
        }
        // dic result
        const dic = state.options.dic;
        const params = state.options.params;

        const offset = params.offset;
        if (offset !== undefined)
            delete params.offset;

        let keywords = [];
        for (let key in params) {
            let param = params[key].replace(/\s/g, '');
            if (param !== '' && key !== 'searchMethod' && key !== 'spellingMethod') {
                keywords.push(param)
            }
        }
        keywords = keywords.join('，');
        const struct = dicStruct.filter(struct => struct.name===dic)[0];
        const chineseName = struct.chineseName;

        // num
        const rowPerPage = 30;
        const totalNum = state.allResults.num;
        const pageNum = Math.ceil(totalNum / rowPerPage);

        // page
        let thisPage = 1;
        if (offset)
            thisPage = offset + 1;
        let pageFrom = thisPage - 3;
        if (pageFrom < 1)
            pageFrom = 1;
        let pageTo = pageFrom + 6;
        
        if (pageTo > pageNum)
            pageTo = pageNum;
        pageFrom = pageTo - 6;
        if (pageFrom < 1)
            pageFrom = 1;

        this.state = {
            dic: dic,
            keywords: keywords,
            totalNum: totalNum,
            pageNum: pageNum,
            thisPage: thisPage,
            pageFrom: pageFrom,
            pageTo: pageTo,
            chineseName: chineseName,
            options: state.options,
            words: state.allResults.words,
            background_height: window.innerHeight - 154,
        };

        this.handleResize = this.handleResize.bind(this);
    }

    handleResize() {
        this.setState({
            background_height: window.innerHeight - 154,
        });
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handlePageClick(page) {
        const options = this.state.options;
        options.params.offset = page - 1;
        this.search(page, options);
    }

    lastPage() {
        let page = this.state.thisPage - 1;
        if (page < 1)
            page = 1;
        const options = this.state.options;
        options.params.offset = page - 1;
        this.search(page, options);
    }

    nextPage() {
        let page = this.state.thisPage + 1;
        if (page > this.state.pageNum)
            page = this.state.pageNum;
        const options = this.state.options;
        options.params.offset = page - 1;
        this.search(page, options);
    }

    goToPage(event) {
        if (event.key === 'Enter') {
            let page = event.target.value;
            if (page < 1)
                page = 1;
            if (page > this.state.pageNum)
                page = this.state.pageNum;
            const options = this.state.options;
            options.params.offset = page - 1;
            this.search(page, options);
        }
    }

    search(page, options) {
        Meteor.call('search', options, (error, results) => {
            if (error) throw new Meteor.Error(error);
            let state = {
                options: options,
                allResults: results,
            }
            this.props.history.push('/single/' + page, state);
        });
    }

    render() {
        let pageFrom = this.state.pageFrom;
        let pageTo = this.state.pageTo;

        let pageView;
        let bottomPageView;
        if (pageTo > 1) {
            let pages = [];
            let listPageNum = (pageTo - pageFrom + 1);

            for (let i = pageFrom; i <= pageTo; ++i)
                pages.push(<button key={i} className={'page-button ' + (this.state.thisPage === i ? 'page-button-selected' : '')} onClick={this.handlePageClick.bind(this, i)}>{i}</button>);
            
            pageView = (
                <div id='single-dic-right-container'>
                    <button id='last-page' className='page-arrow' onClick={this.lastPage.bind(this)}></button>
                    <div className='dic-pages' style={{gridTemplateColumns: 'repeat(' + listPageNum + ', 1fr)'}}>{pages}</div>
                    <button id='next-page' className='page-arrow' onClick={this.nextPage.bind(this)}></button>
                    <span>跳至第</span>
                    <input type='text' onKeyPress={this.goToPage.bind(this)}></input>
                    <span>頁</span>
                </div>
            )

            bottomPageView = (
                <div id='bottom-page-container'>
                    { pageView }
                </div>
            );
        }
        
        
        return (
            <div id='single-dic-container' style={{minHeight: this.state.background_height}}>
                <div id='keywords'><Translate id='keyowrd' />：{this.state.keywords}</div>
                <div id='single-dic-content-container'>
                    <div id='single-dic-title'>
                        <div id='single-dic-left-container'>
                            <h1 className='dic-title'>{this.state.chineseName}</h1>
                            <h2 className='dic-subtitle'>(共{this.state.totalNum}筆，{this.state.pageNum}頁)</h2>
                        </div>
                        { pageView }
                    </div>
                    <BriefWord key={this.state.dic} dic={this.state.dic} words={this.state.words}/>
                    { bottomPageView }
                </div>
            </div>
        );
    }
}

export default withLocalize(withRouter(SingleDic));