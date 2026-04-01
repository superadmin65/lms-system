import React, { useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { getImage, setLocalItem, getLocalItem, publicPath } from 'utils';
import { apiService } from '../../utils/apiService'; // Imported apiService

import {
  Section,
  Input,
  TextArea,
  Button,
  ButtonBar,
  Select,
  Checkbox,
  Overlay,
  ProgButton,
} from 'base/comps';

const Styled = styled.div`
  padding: 20px;
  // background-color: white;
  color: var(--darkColor);
  position: relative;
  user-select: none;
  margin: 0 auto;
  font-size: var(--font2);

  main {
    max-width: 800px;
  }

  h1 {
    font-size: 1.5rem;
    text-align: center;
    text-decoration: underline;
  }

  .topics {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .card {
    display: flex;
    .img {
      background-size: contain;
      background-repeat: no-repeat;
      margin: 0 auto;
    }

    .label,
    .smLabel {
      text-align: center;
    }

    .hoverdesc {
      position: absolute;
      left: -1000px;
      width: 300px;
      background-color: orange;
      padding: 10px;
      border-radius: 10px;
      color: white;
      top: 100px;
      box-shadow: var(--shadow);
      z-index: 1;
    }

    &:hover .hoverdesc {
      /*left: 0;*/
    }
  }

  .infobar {
    margin: -10px;
    padding: 5px 10px 15px 10px;
    font-size: 0.8rem;
    background-color: var(--darkColor2);
    color: white;

    a:hover {
      color: white;
    }
  }

  .descCard {
    display: flex;
    align-items: center;

    .desc {
      max-width: 250px;
      margin-right: 15px;
    }

    .title {
      margin-bottom: 10px;
      font-size: 1.2rem;
    }
  }

  .hilight {
    background-color: var(--darkColor2);
    box-shadow: var(--shadow);

    font-size: 2rem;
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: 2px;
    a {
      color: white;
    }
  }

  .lang-contact {
    font-size: 0.9rem;
  }

  .flex-sb {
    display: flex;
    justify-content: space-around;
  }
`;

const defaultCardStyle = {
  width: 120,
  margin: '25px 0',
  borderRadius: 10,
};

// --- MODIFIED TO ACCEPT ITEM OBJECT ---
const getIconStyle = (item, data) => {
  let iconStyle = data.iconStyle || {
    width: 80,
    height: 80,
  };

  // 1. API Image Handling - UPDATED TO DYNAMIC URL
  if (item && item.id && !isNaN(item.id)) {
    const apiUrl = apiService.getIconUrl(item.id);
    iconStyle.backgroundImage = `url(${apiUrl})`;
    return iconStyle;
  }

  // 2. Static Image Handling (Original Logic)
  const img = item; // assuming item passed was img string in old code
  const imgPath = getImage(`${data.iconsLoc || 'icons'}/${img}.png`);
  const resolveImg = (src) => {
    if (!src) return src;
    if (src.indexOf('http') === 0) return src;
    return publicPath(src.startsWith('/') ? src : `/${src}`);
  };

  iconStyle.backgroundImage = `url(${resolveImg(imgPath)})`;
  return iconStyle;
};

export default function IconView(props) {
  //const {title, menu, onPick} = props;
  let config = getLocalItem('config', {});

  let defaultGrade;
  const data = props.data || {};

  if (data.grades) {
    let defaultItem = data.grades.find((item) => item.default === true);
    if (defaultItem) {
      defaultGrade = defaultItem.id;
    }
  }
  let [state, setState] = useState({
    selectedGrade: config.selectedGrade || defaultGrade,
  });
  let menu = data.list || [];
  if (data.grades) {
    let matches = state.selectedGrade.match(/(\d+)/);
    let gradeNo = (matches && +matches[0]) || 0;
    menu = menu.filter((item) => {
      if (!item.grade) {
        return false;
      }
      let range = item.grade.split('-').map((no) => +no);
      if (range.length === 1) {
        return range[0] === gradeNo;
      } else {
        return range[0] <= gradeNo && range[1] >= gradeNo;
      }

      //item.grade.indexOf(state.selectedGrade) !== -1
    });
  }

  const tocConfig = data.config || {};

  return (
    <Styled>
      <main style={data.style || { maxWidth: 1024, fontSize: '1rem' }}>
        <div className="flex-sb">
          {data.label && <h1 style={data.titleStyle || {}}>{data.label}</h1>}
          {data.grades && (
            <Select
              width="150px"
              options={data.grades}
              value={state.selectedGrade}
              bgColor="inherit"
              onChange={(e) => {
                const cfg = getLocalItem('config', {});
                cfg.selectedGrade = e.value || e.id;
                cfg.selectedSubject = 'all';
                setLocalItem('config', cfg);
                setState({ ...state, selectedGrade: e.value || e.id });
              }}
            />
          )}
        </div>

        <div className="topics">
          {menu.map((item) => {
            const localStyle = item.style || {};
            let style = data.cardStyle || defaultCardStyle;
            style = { ...style, ...localStyle };
            return (
              <div className="card" style={style} key={item.id}>
                {/* <Link reload href={`/p/${item.id}`}> */}
                <Link href={`/p/${item.id}`}>
                  {!tocConfig.type && (
                    <>
                      <div
                        className="img"
                        style={{
                          // UPDATED: Pass 'item' object instead of 'item.img'
                          ...getIconStyle(item, data),
                          backgroundImage: `url(${(function () {
                            // UPDATED: Check for ID first - DYNAMIC URL
                            if (item.id && !isNaN(item.id)) {
                              return apiService.getIconUrl(item.id);
                            }
                            // Original Logic Fallback
                            const imgPath = getImage(
                              `${data.iconsLoc || 'icons'}/${item.img}.png`
                            );
                            if (!imgPath) return imgPath;
                            if (imgPath.indexOf('http') === 0) return imgPath;
                            return publicPath(
                              imgPath.startsWith('/') ? imgPath : `/${imgPath}`
                            );
                          })()})`,
                        }}
                      ></div>
                      <div className="label" style={data.labelStyle || {}}>
                        {item.label}
                      </div>
                      {item.smLabel && (
                        <div
                          className="smLabel"
                          style={data.smLabelStyle || {}}
                        >
                          {item.smLabel}
                        </div>
                      )}
                    </>
                  )}
                  {tocConfig.type === 'descType' && (
                    <div className="descCard">
                      <div>
                        <div
                          className="label title"
                          style={data.labelStyle || {}}
                        >
                          {item.label}
                        </div>
                        {item.smLabel && (
                          <div
                            className="smLabel"
                            style={data.smLabelStyle || {}}
                          >
                            {item.smLabel}
                          </div>
                        )}
                        <div className="desc" style={data.descStyle || {}}>
                          {item.desc}
                        </div>
                      </div>
                      <div
                        className="img"
                        style={{
                          // UPDATED: Pass 'item' object
                          ...getIconStyle(item, data),
                          backgroundImage: `url(${(function () {
                            // UPDATED: Check for ID first - DYNAMIC URL
                            if (item.id && !isNaN(item.id)) {
                              return apiService.getIconUrl(item.id);
                            }
                            // Original Logic
                            const imgPath = getImage(
                              `${data.iconsLoc || 'icons'}/${item.img}.png`
                            );
                            if (!imgPath) return imgPath;
                            if (imgPath.indexOf('http') === 0) return imgPath;
                            return publicPath(
                              imgPath.startsWith('/') ? imgPath : `/${imgPath}`
                            );
                          })()})`,
                        }}
                      ></div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
      {data.moreActivities && (
        <div className="hilight">
          <div>
            <Link href={`/p/${data.moreActivities}`}>More Activities</Link>
          </div>
        </div>
      )}
    </Styled>
  );
}
