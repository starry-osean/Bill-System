import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchLogin, fetchRegister } from "../../store/module/user";
import { useNavigate } from "react-router-dom";
import './index.scss'

const Login = () => {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
    const [loginForm, setLoginForm] = useState({
        mobile: '', 
        code: ''    
    });
    const [registerForm, setRegisterForm] = useState({
        mobile: '',
        code: '',
        confirmCode: ''
    });
    
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isLoading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [countdown, setCountdown] = useState(0);
    const countdownRef = useRef(null);

    // 清理倒计时
    useEffect(() => {
        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, []);

    // 处理登录
    const handleLogin = async () => {
        setMsg('');
        
        if (!loginForm.mobile.trim()) {
            setMsg('请输入手机号');
            return;
        }
        
        if (!loginForm.code.trim()) {
            setMsg('请输入验证码');
            return;
        }

        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobileRegex.test(loginForm.mobile)) {
            setMsg('请输入正确的手机号格式');
            return;
        }

        setLoading(true);

        try {
            await dispatch(fetchLogin(loginForm));
            alert("登录成功");
            localStorage.setItem('Mobile', loginForm.mobile);
            navigate('/mouth');
        } catch (error) {
            console.log("登录失败:", error);
            setMsg('登录失败，请检查手机号和验证码');
        } finally {
            setLoading(false);
        }
    };

    // 处理注册
    const handleRegister = async () => {
        setMsg('');
        
        if (!registerForm.mobile.trim()) {
            setMsg('请输入手机号');
            return;
        }
        
        if (!registerForm.code.trim()) {
            setMsg('请输入验证码');
            return;
        }

        if (registerForm.code !== registerForm.confirmCode) {
            setMsg('两次输入的验证码不一致');
            return;
        }

        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobileRegex.test(registerForm.mobile)) {
            setMsg('请输入正确的手机号格式');
            return;
        }

        setLoading(true);

        try {
            await dispatch(fetchRegister(registerForm));
            alert("注册成功");
            // 注册成功后自动登录或跳转到登录页
            setActiveTab('login');
            setLoginForm(prev => ({ ...prev, mobile: registerForm.mobile }));
        } catch (error) {
            console.log("注册失败:", error);
            setMsg('注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 获取验证码
    const handleGetCode = () => {
        if (countdown > 0) return;
        
        const mobile = activeTab === 'login' ? loginForm.mobile : registerForm.mobile;
        const mobileRegex = /^1[3-9]\d{9}$/;
        
        if (!mobile || !mobileRegex.test(mobile)) {
            setMsg('请输入正确的手机号');
            return;
        }
        
        setCountdown(60);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        // 这里应该调用发送验证码的API
        console.log(`发送验证码到: ${mobile}`);
        setMsg('验证码已发送');
    };

    const resetForms = () => {
        setLoginForm({ mobile: '', code: '' });
        setRegisterForm({ mobile: '', code: '', confirmCode: '' });
        setMsg('');
    };

    const switchToRegister = () => {
        setActiveTab('register');
        resetForms();
    };

    const switchToLogin = () => {
        setActiveTab('login');
        resetForms();
    };

    return (
        <div className="bigbox">
            <div className="neibox">
                <div className={`from-box ${activeTab === 'register' ? 'register-active' : ''}`}>
                    {/* 登录表单 */}
                    <div className={`inputtext ${activeTab === 'register' ? 'hidden' : ''}`}>
                        <h1>login</h1>
                        <input 
                            name="mobile" 
                            placeholder="请输入手机号" 
                            type="tel" 
                            value={loginForm.mobile} 
                            onChange={handleLoginChange}
                            maxLength="11"
                        />
                        <div className="code-input-wrapper">
                            <input 
                                name="code" 
                                placeholder="请输入验证码" 
                                type="text" 
                                value={loginForm.code} 
                                onChange={handleLoginChange}
                                maxLength="6"
                            />
                            {/*<button 
                                className={`yanzheng ${countdown > 0 ? 'disabled' : ''}`}
                                onClick={handleGetCode}
                                disabled={countdown > 0}
                            >
                                {countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码'}
                            </button>*/}
                        </div>
                        {msg && activeTab === 'login' && <div className="error-message">{msg}</div>}
                        <button 
                            className="button1"
                            onClick={handleLogin} 
                            disabled={isLoading && activeTab === 'login'}
                        >
                            {isLoading && activeTab === 'login' ? "登录中..." : "登录"}
                        </button>
                    </div>
                    
                    {/* 注册表单 */}
                    <div className={`register-box ${activeTab === 'login' ? 'hidden' : ''}`}>
                        <h1>register</h1>
                        <input 
                            name="mobile" 
                            placeholder="请输入手机号" 
                            type="tel" 
                            value={registerForm.mobile} 
                            onChange={handleRegisterChange}
                            maxLength="11"
                        />
                        <div className="code-input-wrapper">
                            <input 
                                name="code" 
                                placeholder="请输入验证码" 
                                type="text" 
                                value={registerForm.code} 
                                onChange={handleRegisterChange}
                                maxLength="6"
                            />
                            {/*<button 
                                className={`yanzheng ${countdown > 0 ? 'disabled' : ''}`}
                                onClick={handleGetCode}
                                disabled={countdown > 0}
                            >
                                {countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码'}
                            </button>*/}
                        </div>
                        <input 
                            name="confirmCode" 
                            placeholder="请再次输入验证码" 
                            type="text" 
                            value={registerForm.confirmCode} 
                            onChange={handleRegisterChange}
                            maxLength="6"
                        />
                        {msg && activeTab === 'register' && <div className="error-message">{msg}</div>}
                        <button 
                            className="button1"
                            onClick={handleRegister} 
                            disabled={isLoading && activeTab === 'register'}
                        >
                            {isLoading && activeTab === 'register' ? "注册中..." : "注册"}
                        </button>
                    </div>
                </div>
                
                {/* 左侧欢迎卡片 */}
                <div className="box left">
                    <h2>欢迎加入 </h2>
                    <p>已有账号?</p>
                    <button id="login" onClick={switchToLogin}>去登陆</button>
                </div>
                
                {/* 右侧欢迎卡片 */}
                <div className="box right">
                    <h2>欢迎登录 </h2>
                    <p>没有账号?</p>
                    <button id="register" onClick={switchToRegister}>去注册</button>
                </div>
            </div>
        </div>
    );
};

export default Login;