package com.youlai.boot.system.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.system.mapper.TFloorMapper;
import com.youlai.boot.system.service.TFloorService;
import com.youlai.boot.system.model.entity.TFloor;
import com.youlai.boot.system.model.form.TFloorForm;
import com.youlai.boot.system.model.query.TFloorQuery;
import com.youlai.boot.system.model.vo.TFloorVO;
import com.youlai.boot.system.converter.TFloorConverter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import org.springframework.transaction.annotation.Transactional;

/**
 * 楼层服务实现类
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Service
@RequiredArgsConstructor
public class TFloorServiceImpl extends ServiceImpl<TFloorMapper, TFloor> implements TFloorService {

    private final TFloorConverter tFloorConverter;

    /**
    * 获取楼层分页列表
    *
    * @param queryParams 查询参数
    * @return {@link IPage<TFloorVO>} 楼层分页列表
    */
    @Override
    public IPage<TFloorVO> getTFloorPage(TFloorQuery queryParams) {
        Page<TFloorVO> pageVO = this.baseMapper.getTFloorPage(
                new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams
        );
        return pageVO;
    }
    
    /**
     * 获取楼层表单数据
     *
     * @param id 楼层ID
     * @return 楼层表单数据
     */
    @Override
    public TFloorForm getTFloorFormData(Long id) {
        TFloor entity = this.getById(id);
        return tFloorConverter.toForm(entity);
    }
    
    /**
     * 新增楼层
     *
     * @param formData 楼层表单对象
     * @return 是否新增成功
     */
    @Override
    public boolean saveTFloor(TFloorForm formData) {
        TFloor entity = tFloorConverter.toEntity(formData);
        return this.save(entity);
    }
    
    /**
     * 更新楼层
     *
     * @param id   楼层ID
     * @param formData 楼层表单对象
     * @return 是否修改成功
     */
    @Override
    public boolean updateTFloor(Long id,TFloorForm formData) {
        TFloor entity = tFloorConverter.toEntity(formData);
        return this.updateById(entity);
    }
    
    /**
     * 删除楼层
     *
     * @param ids 楼层ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    @Override
    public boolean deleteTFloors(String ids) {
        Assert.isTrue(StrUtil.isNotBlank(ids), "删除的楼层数据为空");
        // 逻辑删除
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .toList();
        return this.removeByIds(idList);
    }

    @Override
    @Transactional
    public boolean updateTFloorDraw(Long id, String filePath) {
        try {
            this.baseMapper.updateTFloorDraw(id,filePath);
        }catch (Exception e){
            return false;
        }
        return true;
    }

}
