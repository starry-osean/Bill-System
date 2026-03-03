import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchUser } from '../../store/module/user';
import './index.scss';

dayjs.extend(relativeTime);

const User = () => {
  const dispatch = useDispatch();
  const { user: userList = [] } = useSelector(state => state.user);
  const mobileName = localStorage.getItem('Mobile') || '未登录用户';

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  const currentUser = userList[0] || {};

  const profileMeta = useMemo(() => ({
    birth: currentUser.birth ? dayjs(currentUser.birth).format('YYYY年MM月DD日') : '未填写',
    email: currentUser.email || '暂未绑定邮箱',
    signature: currentUser.text || '这个用户还没有留下简介~',
    updated: currentUser.updatedAt
      ? dayjs(currentUser.updatedAt).fromNow()
      : '刚刚'
  }), [currentUser]);

  const summaryCards = useMemo(() => ([
    {
      label: '资料完善度',
      value: `${['birth', 'email', 'text'].filter(key => !!currentUser[key]).length}/3`,
      desc: '基础信息完成度'
    },
    {
      label: '成员总数',
      value: `${userList.length}`,
      desc: '已同步的家庭成员'
    },
    {
      label: '最近更新',
      value: profileMeta.updated,
      desc: '资料更新时间'
    }
  ]), [currentUser, profileMeta.updated, userList.length]);

  const highlights = [
    { title: '生日', value: profileMeta.birth },
    { title: '邮箱', value: profileMeta.email },
    { title: '简介', value: profileMeta.signature }
  ];

  return (
    <div className="user-page">
      <section className="panel hero-card">
        <div className="avatar">
          <img src="/logo.png" alt="用户头像" />
        </div>
        <div className="hero-content">
          <h1>{mobileName}</h1>
          <p>哈哈哈哈</p>
          <div className="hero-tags">
            <span>账单达人</span>
            <span>AI 助理 Beta</span>
          </div>
        </div>
      </section>

      <section className="panel stats-grid">
        {summaryCards.map(card => (
          <div key={card.label} className="stat-card">
            <p className="label">{card.label}</p>
            <p className="value">{card.value}</p>
            <span>{card.desc}</span>
          </div>
        ))}
      </section>

      <section className="panel info-grid">
        {highlights.map(item => (
          <div key={item.title} className="info-card">
            <h3>{item.title}</h3>
            <p>{item.value}</p>
          </div>
        ))}
      </section>

      <section className="panel member-list">
        <div className="section-header">
          <h2>家庭成员</h2>
          <span>{userList.length ? `共 ${userList.length} 人` : '暂无成员档案'}</span>
        </div>
        {userList.length ? (
          <div className="member-grid">
            {userList.map(item => (
              <div className="member-card" key={item.id}>
                <div className="member-meta">
                  <strong>生日</strong>
                  <span>{item.birth || '未填写'}</span>
                </div>
                <div className="member-meta">
                  <strong>邮箱</strong>
                  <span>{item.email || '未绑定'}</span>
                </div>
                <div className="member-note">
                  <strong>简介</strong>
                  <p>{item.text || '暂无描述'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">没有成员信息，去填写一份吧！</div>
        )}
      </section>
    </div>
  );
};

export default User;