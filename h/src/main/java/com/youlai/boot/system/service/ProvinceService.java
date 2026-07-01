package com.youlai.boot.system.service;

import com.youlai.boot.system.model.vo.ProvinceDetailVO;
import com.youlai.boot.system.model.vo.ProvinceVO;
import com.youlai.boot.system.model.vo.TPrisonDetailVO;

import java.util.List;

public interface ProvinceService {

    List<ProvinceVO> getProvinceList();

    ProvinceDetailVO getProvinceInfo(Long provinceId);

    List<TPrisonDetailVO>  getPrisonList(Long provinceId);
}
