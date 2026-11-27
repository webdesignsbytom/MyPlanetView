import { geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-50m.json';
import { places } from './destinations';

// The atlas can assign one ISO code to several features, including territories.
const countries = new Map();
for (const item of feature(world, world.objects.countries).features) {
  const id = String(item.id).padStart(3, '0');
  if (!countries.has(id)) countries.set(id, {type:'GeometryCollection', geometries:[]});
  countries.get(id).geometries.push(item.geometry);
}
const radians=Math.PI/180;
const tilt=12*radians;
export const startLongitude=157;
export const wrap=degrees=>((degrees+540)%360+360)%360-180;
export const initialCards=['392','764','036'].map(id=>places.find(p=>p.id===id));

// A fixed orthographic camera makes the inverse texture coordinates reusable.
// Only the horizontal sample offset changes as Earth turns.
export function makePlanet(canvas,image) {
  const context=canvas.getContext('2d');
  const source=document.createElement('canvas');
  source.width=image.naturalWidth;source.height=image.naturalHeight;
  const reader=source.getContext('2d',{willReadFrequently:true});reader.drawImage(image,0,0);
  const texture=new Uint32Array(reader.getImageData(0,0,source.width,source.height).data.buffer);
  const texWidth=source.width;
  const projection=geoOrthographic();
  const path=geoPath(projection,context);
  let width,height,r,cx,cy,ratio,frame,pixels,indices,offsets,shade,rim;
  function resize() {
    const box=canvas.getBoundingClientRect();
    ratio=Math.min(devicePixelRatio||1,1.45,1250/Math.max(1,box.width));
    width=canvas.width=Math.max(1,Math.round(box.width*ratio));
    height=canvas.height=Math.max(1,Math.round(box.height*ratio));
    r=Math.min(height*.47,width*.62);cx=width*.977;cy=height*.49;
    projection.translate([cx,cy]).scale(r).precision(.65*ratio);
    frame=context.createImageData(width,height);pixels=new Uint32Array(frame.data.buffer);
    indices=new Int32Array(width*height);indices.fill(-1);offsets=new Uint16Array(width*height);
    for(let y=0;y<height;y++){
      const north=(cy-y)/r;
      for(let x=Math.max(0,Math.floor(cx-r));x<width;x++){
        const east=(x-cx)/r,zz=1-east*east-north*north;
        if(zz<=0)continue;
        const z=Math.sqrt(zz);
        const lat=Math.asin(north*Math.cos(tilt)+z*Math.sin(tilt));
        const lon=Math.atan2(east,z*Math.cos(tilt)-north*Math.sin(tilt));
        const i=y*width+x;
        offsets[i]=Math.floor((lon/(2*Math.PI)+.5)*texWidth);
        indices[i]=Math.min(source.height-1,Math.floor((.5-lat/Math.PI)*source.height))*texWidth;
      }
    }
    shade=context.createLinearGradient(cx-r,cy-r,cx+r*.32,cy+r*.25);
    shade.addColorStop(0,'#6496c52b');shade.addColorStop(.42,'#00102706');shade.addColorStop(1,'#020b2680');
    rim=context.createRadialGradient(cx,cy,r*.88,cx,cy,r+1);
    rim.addColorStop(0,'#78c8ff00');rim.addColorStop(.82,'#74bdff19');rim.addColorStop(.98,'#80ceffa8');rim.addColorStop(1,'#d0efffbd');
  }
  function draw(lon,cards,anchors){
    const shift=Math.floor(lon/360*texWidth);
    for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(height,cy+r+1);y++){
      for(let i=y*width+Math.max(0,Math.floor(cx-r));i<(y+1)*width;i++){
        if(indices[i]>=0)pixels[i]=texture[indices[i]+((offsets[i]+shift)&(texWidth-1))];
      }
    }
    context.putImageData(frame,0,0);
    context.beginPath();context.arc(cx,cy,r,0,Math.PI*2);context.fillStyle=shade;context.fill();context.fillStyle=rim;context.fill();
    context.save();context.shadowBlur=12*ratio;context.shadowColor='#64adeb';context.lineWidth=1.3*ratio;context.strokeStyle='#a5daefb3';context.stroke();context.restore();
    projection.rotate([-lon,-12]);
    cards.forEach((place,slot)=>{
      if(!place)return;
      const geometry=countries.get(place.id);
      const delta=wrap(place.point[0]-lon)*radians,lat=place.point[1]*radians;
      const facing=Math.sin(lat)*Math.sin(tilt)+Math.cos(lat)*Math.cos(tilt)*Math.cos(delta);
      const [x,y]=projection(place.point);
      if(facing<.045 || x>width-3*ratio)return;
      if(geometry){
        context.beginPath();path(geometry);context.fillStyle='rgba(58,241,183,.61)';context.fill();
        context.strokeStyle='#9effdf';context.lineWidth=1.9*ratio;context.stroke();
      }
      const a=anchors[slot];if(!a)return;
      const ax=a[0]*ratio,ay=a[1]*ratio;
      const lead=Math.max(0,(x-ax)*.20);
      const elbow=Math.min(Math.abs(y-ay)*.8,Math.max(0,(x-ax)*.55));
      context.beginPath();context.moveTo(ax,ay);context.lineTo(ax+lead,ay);
      context.lineTo(ax+lead+elbow,y);context.lineTo(x,y);
      context.lineWidth=2.3*ratio;context.strokeStyle='#ffd980';context.stroke();
      context.beginPath();context.arc(x,y,6*ratio,0,Math.PI*2);context.strokeStyle='#ffe0a5ac';context.stroke();
      context.beginPath();context.arc(x,y,2.6*ratio,0,Math.PI*2);context.fillStyle='#fff0c5';context.fill();
    });
  }
  resize();
  return {resize,draw,screenY(place,lon){return projection.rotate([-lon,-12])(place.point)[1];},canShow(place,lon){
    const delta=wrap(place.point[0]-lon), [x]=projection.rotate([-lon,-12])(place.point);
    return delta>-72 && delta<12 && x<width-12*ratio;
  }};
}
