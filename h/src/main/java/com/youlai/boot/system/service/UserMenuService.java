package com.youlai.boot.system.service;


import com.baomidou.mybatisplus.extension.service.IService;
import com.youlai.boot.system.model.entity.UserMenu;

import java.util.List;

public interface UserMenuService extends IService<UserMenu> {

    /**
     * 保存用户区域
     *
     * @param userId
     * @param menuIds
     * @return
     */
    void saveUserMenus(Long userId, List<Long> menuIds);

}
