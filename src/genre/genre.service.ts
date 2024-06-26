import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { MovieService } from 'src/movie/movie.service'
import { CreateGenreDto } from './create-genre.dto'
import { Collection } from './genre.interface'
import { GenreModel } from './genre.model'

@Injectable()
export class GenreService {
	constructor(
		@InjectModel(GenreModel) private readonly GenreModel: ModelType<GenreModel>,
		private readonly movieService: MovieService
	) {}

	async bySlug(slug: string) {
		const genre = await this.GenreModel.findOne({ slug }).exec()
		if (!genre) throw new NotFoundException('Genre not found')

		return genre
	}

	async getAll(searchTerms?: string) {
		let options = {}

		if (searchTerms) {
			options = {
				$or: [
					{
						name: new RegExp(searchTerms, 'i'),
					},
					{
						slug: new RegExp(searchTerms, 'i'),
					},
					{
						description: new RegExp(searchTerms, 'i'),
					},
				],
			}
		}

		return this.GenreModel.find(options)
			.select('-updateAt -__v')
			.sort({
				createdAt: 'desc',
			})
			.exec()
	}

	async getCollections() {
		const genres = await this.getAll()

		const collections = await Promise.all(
			genres.map(async genre => {
				const moviesByGenre = await this.movieService.byGenres([genre._id])

				const result: Collection = {
					_id: String(genre._id),
					image: moviesByGenre[0].bigPoster,
					title: genre.name,
					slug: genre.slug,
				}

				return result
			})
		)

		return collections
	}

	// Admin place

	async byId(_id: string) {
		const genre = await this.GenreModel.findById(_id)

		if (!genre) {
			throw new BadRequestException('Genre not found')
		}

		return genre
	}

	async create() {
		const defaultValue: CreateGenreDto = {
			name: '',
			slug: '',
			description: '',
			icon: '',
		}

		const genre = await this.GenreModel.create(defaultValue)

		return genre._id
	}

	async update(_id: string, dto: CreateGenreDto) {
		const updateGenre = await this.GenreModel.findByIdAndUpdate(_id, dto, {
			new: true,
		}).exec()

		if (!updateGenre) {
			throw new NotFoundException('Genre not found')
		}

		return updateGenre
	}

	async delete(_id: string) {
		const deleteGenre = await this.GenreModel.findByIdAndDelete(_id)

		if (!deleteGenre) {
			throw new NotFoundException('Genre not found')
		}

		return deleteGenre
	}
}
