/**
 * Axios 请求封装
 * 统一处理请求和响应拦截
 */
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // Vite 会代理到 http://localhost:3013/api
  timeout: 30000, // 30 秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以添加 token 等认证信息
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;

    // 统一响应格式: { code, message, data, timestamp }
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }

    return res.data;
  },
  (error) => {
    console.error('响应错误:', error);

    let message = '网络错误';
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message = data.message || '请求参数错误';
          break;
        case 401:
          message = '未授权,请登录';
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 429:
          message = '请求过于频繁,请稍后再试';
          break;
        case 500:
          message = data.message || '服务器内部错误';
          break;
        default:
          message = data.message || `错误代码: ${status}`;
      }
    } else if (error.request) {
      message = '网络请求失败,请检查网络连接';
    } else {
      message = error.message || '请求配置错误';
    }

    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default service;
