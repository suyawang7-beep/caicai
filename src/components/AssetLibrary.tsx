import { useRef } from 'react';
import type { Asset } from '../types/project';

export function AssetLibrary({ assets, urls, onUpload, onAdd }: { assets: Asset[]; urls: Record<string, string>; onUpload: (files: File[]) => void; onAdd: (id: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <aside className="assets"><div className="panel-title">美术资产 <button onClick={() => input.current?.click()}>上传</button></div><input ref={input} hidden type="file" accept="image/png,image/webp,image/gif,image/jpeg" multiple onChange={(event) => { onUpload(Array.from(event.target.files ?? [])); event.currentTarget.value = ''; }} /><div className="asset-grid">{assets.map((asset) => <button className="asset" key={asset.id} onClick={() => onAdd(asset.id)} title={`添加 ${asset.name} 到画布`}>{urls[asset.id] ? <img src={urls[asset.id]} /> : <span>图片</span>}<small>{asset.name}</small></button>)}</div>{assets.length === 0 && <p className="empty">上传透明 PNG 或 WebP，点击素材即可添加。</p>}</aside>;
}
