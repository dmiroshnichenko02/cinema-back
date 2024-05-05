import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { TelegramService } from 'src/telegram/telegram.service'
import { CreateMovieDto } from './create-movie.dto'
import { MovieModel } from './movie.model'

@Injectable()
export class MovieService {
	constructor(
		@InjectModel(MovieModel) private readonly MovieModel: ModelType<MovieModel>,
		private readonly telegramService: TelegramService
	) {}

	async getAll(searchTerms?: string) {
		let options = {}

		if (searchTerms) {
			options = {
				$or: [
					{
						title: new RegExp(searchTerms, 'i'),
					},
				],
			}
		}

		return this.MovieModel.find(options)
			.select('-updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.populate('actors genres')
			.exec()
	}

	async bySlug(slug: string) {
		const movie = await this.MovieModel.findOne({ slug })
			.populate('actors genres')
			.exec()
		if (!movie) throw new NotFoundException('Movie not found')

		return movie
	}

	async byActor(actorId: Types.ObjectId) {
		const movies = await this.MovieModel.find({ actors: actorId }).exec()
		if (!movies || !movies.length)
			throw new NotFoundException('Movie not found')

		return movies
	}

	async byGenres(genreIds: Types.ObjectId[]) {
		const movies = await this.MovieModel.find({
			genres: { $in: genreIds },
		}).exec()
		if (!movies) throw new NotFoundException('Movie not found')

		return movies
	}

	async updateCountOpened(slug: string) {
		const updateMovie = await this.MovieModel.findOneAndUpdate(
			{ slug },
			{ $inc: { countOpened: 1 } },
			{ new: true }
		).exec()

		if (!updateMovie) throw new NotFoundException('Movie not found')

		return updateMovie
	}

	async getMostPopular() {
		return this.MovieModel.find({ countOpened: { $gt: 0 } })
			.sort({ countOpened: -1 })
			.populate('genres')
			.exec()
	}

	async updateRating(movieId: Types.ObjectId, newRating: number) {
		return this.MovieModel.findByIdAndUpdate(
			movieId,
			{
				rating: newRating,
			},
			{
				new: true,
			}
		).exec()
	}

	// Admin

	async byId(_id: string) {
		const movie = await this.MovieModel.findById(_id)
		if (!movie) throw new NotFoundException('Movie not found')

		return movie
	}

	async create() {
		const defaultValue: CreateMovieDto = {
			bigPoster: '',
			actors: [],
			genres: [],
			poster: '',
			title: '',
			videoUrl: '',
			slug: '',
		}
		const movie = await this.MovieModel.create(defaultValue)

		return movie._id
	}

	async update(_id: string, dto: CreateMovieDto) {
		if (!dto.isSendTelegram) {
			await this.sendNotification(dto)
			dto.isSendTelegram = true
		}

		const updateMovie = await this.MovieModel.findByIdAndUpdate(_id, dto, {
			new: true,
		}).exec()

		if (!updateMovie) throw new NotFoundException('Movie not found')

		return updateMovie
	}

	async delete(_id: string) {
		const deleteMovie = this.MovieModel.findByIdAndDelete(_id).exec()

		if (!deleteMovie) throw new NotFoundException('Movie not found')

		return deleteMovie
	}

	async sendNotification(dto: CreateMovieDto) {
		// if(process.env.NODE_ENV !== 'development')
		// 	await this.telegramService.sendPhoto(dto.poster)

		await this.telegramService.sendPhoto(
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz41x6n-Pbfdnh31bhKSgT3CLFl5jF9GNOWla1rGjQIQ&s'
		)
		const message = `<b>${dto.title}</b>`
		await this.telegramService.sendMessage(message, {
			reply_markup: {
				inline_keyboard: [
					[
						{
							url: 'https://okko.tv/movie/free-guy',
							text: '🍿 Go to watch',
						},
					],
				],
			},
		})
	}
}
