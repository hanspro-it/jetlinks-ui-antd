import {PageHeaderWrapper} from "@ant-design/pro-layout"
import {Badge, Card, Descriptions, Divider, Row, Table} from "antd";
import React, {Fragment, useEffect, useState} from "react";
import styles from '@/utils/table.less';
import SearchForm from "@/components/SearchForm";
import {ColumnProps, PaginationConfig, SorterResult} from "antd/lib/table";
import Service from "../service";
import encodeQueryParam from "@/utils/encodeParam";
import {Dispatch} from "@/models/connect";
import Play from './play';
import ChannelEdit from './edit/index';

interface Props {
  dispatch: Dispatch;
  location: Location;
}

interface State {
  searchParam: any;
}

const initState: State = {
  searchParam: {terms: location?.query?.terms, sorts: {field: 'id', order: 'desc'}},
};
const MediaDevice: React.FC<Props> = props => {
  const {location: {pathname},} = props;
  const service = new Service('media/channel');
  const [loading, setLoading] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [result, setResult] = useState<any[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [channel, setChannel] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<any>({});
  const [playing, setPlaying] = useState<boolean>(false);
  const [data, setData] = useState<any>({});

  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const statusMap = new Map();
  statusMap.set('online', 'success');
  statusMap.set('offline', 'error');
  statusMap.set('notActive', 'processing');

  const ptzType = new Map();
  ptzType.set(0, '未知');
  ptzType.set(1, '球体');
  ptzType.set(2, '半球体');
  ptzType.set(3, '固定枪机');
  ptzType.set(4, '遥控枪机');

  useEffect(() => {
    if (pathname.indexOf('channel') > 0) {
      const list = pathname.split('/');
      deviceDetail(list[list.length - 1]);
      setDeviceId(list[list.length - 1]);
      searchParam.terms = {deviceId: list[list.length - 1]};
      handleSearch(searchParam);
    }
  }, [window.location.hash]);

  const deviceDetail = (deviceId: string) => {
    service.mediaDevice(deviceId).subscribe((data) => {
        setDeviceInfo(data);
      },
      () => {
      },
      () => {
      })
  };

  const handleSearch = (params?: any) => {
    setSearchParam(params);
    setLoading(true);
    service.mediaDeviceNoPaging(encodeQueryParam(params)).subscribe(
      (data) => {
        const temp = data.map((item: any) => ({parentId: item.parentChannelId, ...item}));
        setResult(temp);
      },
      () => {
      },
      () => setLoading(false));
  };


  const columns: ColumnProps<any>[] = [
    {
      title: '通道国标编号',
      dataIndex: 'channelId',
      ellipsis: true,
    },
    {
      title: '通道名称',
      dataIndex: 'name',
      ellipsis: true,
      // onCell: record => {
      //   return {
      //     onDoubleClick: () => {
      //       console.log(record);
      //     },
      //   };
      // }
    },
    {
      title: '厂商',
      dataIndex: 'manufacturer',
      ellipsis: true,
    },
    {
      title: '安装地址',
      dataIndex: 'address',
      width: '15%',
      ellipsis: true,
    },
    {
      title: '云台类型',
      dataIndex: 'others.ptzType',
      width: 100,
      render: record => ptzType.get(record),
      ellipsis: true,
    },
    {
      title: '在线状态',
      dataIndex: 'status',
      width: 110,
      render: record => record ? <Badge status={statusMap.get(record.value)} text={record.text}/> : '',
      filters: [
        {
          text: '离线',
          value: 'offline',
        },
        {
          text: '在线',
          value: 'online',
        },
      ],
      filterMultiple: false,
    },
    {
      title: '子通道数',
      dataIndex: 'subCount',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: '10%',
      ellipsis: true
    },
    {
      title: '操作',
      align: 'center',
      // fixed: 'right',
      render: (record: any) => (
        <Fragment>
          <a
            onClick={() => {
              setChannel(true);
              setChannelInfo(record);
            }}
          >
            编辑
          </a>
          <Divider type="vertical"/>
          {record.status.value === 'online' && (
            <a
              onClick={() => {
                setPlaying(true);
                setData(record)
              }}
            >
              播放
            </a>
          )}
        </Fragment>
      )
    },
  ];

  const onTableChange = (
    pagination: PaginationConfig,
    filters: any,
    sorter: SorterResult<any>,
  ) => {
    searchParam.terms = filters;
    searchParam.terms['deviceId'] = deviceId;
    searchParam.sorts = sorter.field ? sorter : {field: 'id', order: 'desc'};

    handleSearch(searchParam);
  };

  const content = (
    <div style={{marginTop: 30}}>
      <Descriptions column={4}>
        <Descriptions.Item label="设备名称">
          <div>
            {deviceInfo.name}
            {/*<a style={{marginLeft: 10}}
               onClick={() => {
                 router.push(`/device/instance/save/${deviceInfo.id}`);
               }}
            >查看</a>*/}
          </div>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );

  const titleInfo = (
    <Row>
      <div>
        <span style={{paddingRight: 20}}>
          通道列表：{deviceId}
        </span>
        <Badge status={statusMap.get(deviceInfo.state?.value)} text={deviceInfo.state?.text}/>
      </div>
    </Row>
  );

  return (
    <PageHeaderWrapper title={titleInfo} content={content}>
      <Card style={{height: 92, marginBottom: 16}}>
        <div className={styles.tableList} style={{marginTop: -22}}>
          <div>
            <SearchForm
              search={(params: any) => {
                setSearchParam(params);
                params ? params.deviceId = deviceId : params = {deviceId: deviceId};
                handleSearch({terms: {...params}, sorts: {field: 'id', order: 'desc'}});
              }}
              formItems={[
                {
                  label: '名称',
                  key: 'name$LIKE',
                  type: 'string',
                },
              ]}
            />
          </div>
        </div>
      </Card>
      <Card>
        <div className={styles.StandardTable}>
          <Table
            loading={loading}
            dataSource={result}
            columns={columns}
            rowKey="id"
            // scroll={{x: '120%'}}
            onChange={onTableChange}
            pagination={{
              pageSize: 10
            }}/>
        </div>
      </Card>
      {playing && <Play data={data} close={() => {
        setPlaying(false)
      }} ok={() => {
        setPlaying(false)
      }}/>}

      {channel && <ChannelEdit data={channelInfo} close={() => {
        setChannel(false);
        handleSearch(searchParam);
      }}/>

      }
    </PageHeaderWrapper>
  )
};
export default MediaDevice;
