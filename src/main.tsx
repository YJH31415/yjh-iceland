import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

class AppErrorBoundary extends React.Component<React.PropsWithChildren, {error:string|null}> {
  state={error:null as string|null};
  static getDerivedStateFromError(error:unknown){return {error:error instanceof Error?error.message:String(error)};}
  componentDidCatch(error:unknown,info:React.ErrorInfo){console.error('Application render failed:',error,info.componentStack);}
  render(){
    if(this.state.error)return <main style={{minHeight:'100vh',padding:'32px',background:'#07111d',color:'#f4c7a5',fontFamily:'sans-serif'}}>
      <h1>시뮬레이터를 불러오지 못했습니다.</h1>
      <p>화면 렌더링 중 오류가 발생했습니다. 아래 오류 내용을 개발자에게 전달해 주세요.</p>
      <pre style={{whiteSpace:'pre-wrap',padding:'16px',background:'#132638',color:'#fff',borderRadius:'8px'}}>{this.state.error}</pre>
      <button onClick={()=>location.reload()} style={{padding:'10px 16px',borderRadius:'6px'}}>새로고침</button>
    </main>;
    return this.props.children;
  }
}
const root=document.getElementById('root');
if(root)createRoot(root).render(<React.StrictMode><AppErrorBoundary><App/></AppErrorBoundary></React.StrictMode>);
else document.body.innerHTML='<main style="padding:24px;font-family:sans-serif">오류: #root 요소를 찾을 수 없습니다.</main>';
