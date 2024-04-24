import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	Query,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { CreateGenreDto } from './create-genre.dto'
import { GenreService } from './genre.service'

@Controller('genres')
export class GenreController {
	constructor(private readonly genreService: GenreService) {}

	@Get('by-slug/:slug')
	@HttpCode(200)
	async getGenreBySlug(@Param('slug') slug: string) {
		return this.genreService.bySlug(slug)
	}

	@Get('/collections')
	@HttpCode(200)
	async getCollections() {
		return this.genreService.getCollections()
	}

	@Get()
	@HttpCode(200)
	async getAllGenres(@Query('searchTerms') searchTerms?: string) {
		return this.genreService.getAll(searchTerms)
	}

	@Get(':id')
	@Auth('admin')
	async getById(@Param('id', IdValidationPipe) id: string) {
		return this.genreService.byId(id)
	}

	@UsePipes(new ValidationPipe())
	@Post()
	@HttpCode(200)
	@Auth('admin')
	async createGenre() {
		return this.genreService.create()
	}

	@UsePipes(new ValidationPipe())
	@Put(':id')
	@HttpCode(200)
	@Auth('admin')
	async updateGenre(
		@Param('id', IdValidationPipe) id: string,
		@Body() dto: CreateGenreDto
	) {
		return this.genreService.update(id, dto)
	}

	@Delete(':id')
	@HttpCode(200)
	@Auth('admin')
	async deleteGenre(@Param('id', IdValidationPipe) id: string) {
		return this.genreService.delete(id)
	}
}
