import { Injectable, NotFoundException } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { InjectModel } from 'nestjs-typegoose'
import { ActorDto } from './actor.dto'
import { ActorModel } from './actor.model'

@Injectable()
export class ActorService {
	constructor(
		@InjectModel(ActorModel) private readonly ActorModel: ModelType<ActorModel>
	) {}

	async bySlug(slug: string) {
		const actor = await this.ActorModel.findOne({ slug }).exec()
		if (!actor) throw new NotFoundException('Actor not found')

		return actor
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
				],
			}
		}

		//Agregations

		return this.ActorModel.aggregate()
			.match(options)
			.lookup({
				from: 'Movie',
				foreignField: 'actors',
				localField: '_id',
				as: 'movies',
			})
			.addFields({
				countMovies: {
					$size: '$movies',
				},
			})
			.project({
				__v: 0,
				updatedAt: 0,
				movies: 0,
			})
			.sort({ createdAt: -1 })
			.exec()
	}

	async byId(_id: string) {
		const actor = await this.ActorModel.findById(_id)
		if (!actor) throw new NotFoundException('Actor not found')

		return actor
	}

	async create() {
		const defaultValue: ActorDto = {
			name: '',
			slug: '',
			photo: '',
		}
		const actor = await this.ActorModel.create(defaultValue)

		return actor._id
	}

	async update(_id: string, dto: ActorDto) {
		const updateActor = await this.ActorModel.findByIdAndUpdate(_id, dto, {
			new: true,
		}).exec()

		if (!updateActor) throw new NotFoundException('Actor not found')

		return updateActor
	}

	async delete(_id: string) {
		const deleteActor = this.ActorModel.findByIdAndDelete(_id).exec()

		if (!deleteActor) throw new NotFoundException('Actor not found')

		return deleteActor
	}
}
