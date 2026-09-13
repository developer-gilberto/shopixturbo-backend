import { Body, Controller, Get, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DateRangeValidationPipe } from 'src/common/pipes/date-range-validation.pipe';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { GetShopDTO } from '../shops/shops.dto';
import {
  GetProductFullDTO,
  GetProductInfoDTO,
  GetProductListQueryDTO,
  GetProductListResponseDTO,
  GetSpecificProductQueryDTO,
  ProductResponseDTO,
  ProductsFullResponseDTO,
  ProductsUpdateCostAndTaxesDTO,
  ProductsUpdateCostAndTaxesResponseDTO,
} from './products.dto';
import { ProductsService } from './products.service';
import { GetProductInfoResponseDTO } from './products-info.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get('list/:shop_id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetProductListResponseDTO,
    description: 'Lista os produtos da loja com paginação e filtros',
  })
  async getProductList(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query(new DateRangeValidationPipe()) query: GetProductListQueryDTO,
  ) {
    return await this.productService.getProductsList({
      userId: user.id,
      shopId: param.shop_id,
      offset: Number(query.offset),
      page_size: Number(query.page_size),
      update_time_from: Number(query.update_time_from),
      update_time_to: Number(query.update_time_to),
      item_status: query.item_status,
    });
  }

  @Get('info/:shop_id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetProductInfoResponseDTO,
    description: 'Retorna informações detalhadas dos produtos da Shopee',
  })
  async getProducsInfo(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query() query: GetProductInfoDTO,
  ) {
    return await this.productService.getProductsInfo({
      userId: user.id,
      shopId: param.shop_id,
      itemIdList: query.item_id_list,
    });
  }

  @Get('full/:shop_id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ProductsFullResponseDTO,
    description: 'Retorna os produtos completos do catálogo interno',
  })
  async getProductsFull(
    @CurrentUser() user: TokenPayload,
    @Param() data: GetShopDTO,
    @Query() pagination: GetProductFullDTO,
  ) {
    return await this.productService.getProductsFull(user.id, data.shop_id, pagination);
  }

  @Get(':shop_id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ProductResponseDTO,
    description: 'Retorna os dados de um produto específico da loja',
  })
  async getSpecificProductById(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query() query: GetSpecificProductQueryDTO,
  ) {
    return await this.productService.getSpecificProductById(user.id, param.shop_id, query.product_id);
  }

  @Patch('cost-taxes/:shop_id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ProductsUpdateCostAndTaxesResponseDTO,
    description: 'Atualiza custo e impostos de um lote de produtos',
  })
  async updateCostAndTaxes(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Body() data: ProductsUpdateCostAndTaxesDTO,
  ) {
    return await this.productService.updateCostAndTaxes(user.id, param.shop_id, data);
  }
}
