package com.youlai.boot.system.service;


import com.baomidou.mybatisplus.extension.service.IService;
import com.youlai.boot.system.model.entity.UserArea;

import java.util.List;

public interface UserAreaService extends IService<UserArea> {

    /**
     * 保存用户区域
     *
     * @param userId
     * @param areaIds
     * @return
     */
    void saveUserAreas(Long userId, List<Long> areaIds);

}
