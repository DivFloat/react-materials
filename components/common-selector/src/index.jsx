import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Select } from '@alifd/next';

export default class MultiSelector extends Component {
  static propTypes = {
    defaultDataSource: PropTypes.array,
    defaultValue: PropTypes.array,
    value: PropTypes.array,
    onChange: PropTypes.func,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    width: PropTypes.number,
    placeholder: PropTypes.string,
    fetchData: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    itemRender: PropTypes.func,
    fillProps: PropTypes.string,
    className: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
  };

  static defaultProps = {
    defaultDataSource: [],
    onChange: () => {},
    size: 'medium',
    className: '',
    width: 250,
    disabled: false,
    placeholder: '输入关键字搜索',
  };

  constructor(props) {
    super(props);

    let value = [];
    if ('value' in props) {
      value = props.value;
    } else if ('defaultValue' in props) {
      value = props.defaultValue;
    }
    this.state = {
      value,
      loading: false,
      dataSource: props.defaultDataSource,
      // 下拉列表是否可见
      visible: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps) {
      this.setState({
        value: nextProps.value,
      });
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  // 异步获取数据
  fetchData = (query) => {
    const { fetchData } = this.props;

    if (query.inputValue === '' && this.defaultData) {
      this.setState({
        visible: true,
        dataSource: this.defaultData,
        loading: false,
      });
    }

    this.setState({
      visible: true,
      loading: true,
      errorMessage: null,
    });

    fetchData(query).catch((err) => {
      this.setState({
        errorMessage: err.message,
        loading: false,
        visible: true,
      });
    }).then((dataSource) => {
      if (query.inputValue === '') {
        this.defaultData = dataSource;
      }

      this.setState({
        visible: true,
        dataSource,
        loading: false,
      });
    });
  };

  // input focus
  onInputFocus = (e, clickByUser) => {
    const { isFocusShow } = this.props;
    if (isFocusShow && clickByUser) {
      // 默认 keywords 为空字符串
      this.fetchData({
        inputValue: '',
      });
    }
  };

  // 输入
  onInputChange = (key) => {
    if (this.timer) clearTimeout(this.timer);
    const timeout = 300;

    this.timer = setTimeout(() => {
      clearTimeout(this.timer);
      this.fetchData({
        inputValue: key,
      });
    }, timeout);
  };

  // 组件整体 onChange
  onChange = (currentValue, actionType, dataSource) => {
    const { min, max } = this.props;
    if ('min' in this.props && currentValue.length < min) {
      this.setState({
        errorMessage: `最少不能超过 ${min} 个`,
      });
      return;
    }

    if ('max' in this.props && currentValue.length > max) {
      this.setState({
        errorMessage: `最多不能超过 ${max} 个`,
      });
      return;
    }

    if (!('value' in this.props)) {
      this.setState({ value: currentValue });
    }
    if (currentValue !== this.state.value) {
      this.props.onChange(currentValue, actionType, dataSource);
    }
  };

  // 同步 visible: 组件的设计比较奇葩
  onVisibleChange = (visible) => {
    const { visible: stateVisible } = this.state;

    if (stateVisible !== visible) {
      this.setState({
        visible,
        errorMessage: null,
      });
    }
  };

  getDataSource = () => {
    const { loading, dataSource } = this.state;

    if (loading) {
      return [
        {
          label: <span>查询中...</span>,
          value: '-1',
          disabled: true,
        },
      ];
    }

    if (dataSource) {
      if (dataSource.length === 0) {
        return [
          {
            label: <span>没有找到匹配项</span>,
            value: '-2',
            disabled: true,
          },
        ];
      }

      const { itemRender } = this.props;
      return dataSource.map((item) => {
        return {
          ...item,
          // 这里不能直接用 Select 的 itemRender，上面两种状态会乱掉
          label: itemRender ? itemRender(item) : item.label,
        };
      });
    }
  };

  render() {
    const { visible, errorMessage, value } = this.state;
    const {
      className, style, width, size, placeholder, disabled, fillProps,
    } = this.props;
    const dataSource = this.getDataSource();

    return (
      <div className={`ice-multi-selector ${className}`} style={style}>
        <Select
          style={{
            width,
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
          onChange={this.onChange}
          dataSource={dataSource}
          value={value}
          onSearch={this.onInputChange}
          onFocus={this.onInputFocus}
          onVisibleChange={this.onVisibleChange}
          visible={visible}
          filterLocal={false}
          fillProps={fillProps}
          hasArrow={false}
          hiddenSelected
          mode="tag"
          size={size}
          placeholder={placeholder}
          disabled={disabled}
        />
        {errorMessage ? (
          <span
            className="error-msg"
            dangerouslySetInnerHTML={{ __html: errorMessage }}
          />
        ) : null}
      </div>
    );
  }
}
