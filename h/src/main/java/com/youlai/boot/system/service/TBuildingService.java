package com.youlai.boot.system.service;

import com.youlai.boot.system.model.entity.TBuilding;
import com.youlai.boot.system.model.form.TBuildingForm;
import com.youlai.boot.system.model.query.TBuildingQuery;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TBuildingInfoVO;
import com.youlai.boot.system.model.vo.TBuildingVO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.youlai.boot.system.model.vo.TFloorDetailVO;

import java.util.List;

/**
 * 楼栋服务类
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
public interface TBuildingService extends IService<TBuilding> {

    /**
     *楼栋分页列表
     *
     * @return {@link IPage<TBuildingVO>} 楼栋分页列表
     */
    IPage<TBuildingVO> getTBuildingPage(TBuildingQuery queryParams);

    /**
     * 获取楼栋表单数据
     *
     * @param id 楼栋ID
     * @return 楼栋表单数据
     */
     TBuildingForm getTBuildingFormData(Long id);

    /**
     * 新增楼栋
     *
     * @param formData 楼栋表单对象
     * @return 是否新增成功
     */
    boolean saveTBuilding(TBuildingForm formData);

    /**
     * 修改楼栋
     *
     * @param id   楼栋ID
     * @param formData 楼栋表单对象
     * @return 是否修改成功
     */
    boolean updateTBuilding(Long id, TBuildingForm formData);

    /**
     * 删除楼栋
     *
     * @param ids 楼栋ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    boolean deleteTBuildings(String ids);


    TBuildingInfoVO getTBuildingInfo(Long id);

    List<TFloorDetailVO> getFloorList(Long id);

}
